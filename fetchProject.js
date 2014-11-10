#!/usr/bin/env node
"use strict";
var request = require("request");
var fs      = require('fs');
var http    = require('http');
var child_process = require('child_process');

if(process.argv.length < 3) {
  console.log("Usage:");
  console.log("  ./fetchProject.js #project-id");
  console.log("or");
  console.log("  node fetchProject #project-id");
  process.exit();
}

var projectId   = process.argv[2];
var project_url = 'http://cdn.projects.scratch.mit.edu/internalapi/project/' + projectId + '/get/';
var asset_base_host  = 'cdn.assets.scratch.mit.edu';
var asset_base_path  = '/internalapi/asset/';
var asset_path_suffix = '/get/';

var loadAsset = function(filename) {

  var options = {
    hostname: asset_base_host,
    port: 80,
    path: asset_base_path + filename + asset_path_suffix,
    method: 'GET',
    headers: { 'accept-encoding':'gzip,deflate' }
  };

  http.get(options, function(res){
    var body = '';
    res.setEncoding('binary');

    res.on('data', function(chunk){
      body += chunk;
    });

    res.on('end', function(){
      fs.writeFile(__dirname + '/test/projects/' + filename, body, 'binary', function(err) {
          if (err) throw err
          console.log(filename + ' saved.');
      });
    });
  });

};

var projectFetchCallback = function (error, response, body) {
//  if (!error && response.statusCode === 200) {
  if (error || response.statusCode !== 200) throw new Error("Could not fetch project.");

  //fetch and store assets
  var data = JSON.parse(body);

  for(var i = 0; i < data.costumes.length; i++) {
    loadAsset(data.costumes[i].baseLayerMD5);
  }

  loadAsset(data.penLayerMD5);

  for(var i = 0; i < data.children.length; i++) {
    var costumes = data.children[i].costumes;
    for(var j = 0; j < costumes.length; j++) {
      loadAsset(costumes[j].baseLayerMD5);
    }
  }

  fs.writeFile(__dirname + '/test/projects/' + projectId + '.json', body, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log(projectId + ".json saved");
    }
  });
//  }
};

request({
    url: project_url
}, projectFetchCallback);

