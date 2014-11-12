#!/usr/bin/env node
"use strict";
var request = require("request");
var fs      = require('fs');
var http    = require('http');
var zlib    = require('zlib');

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
  };

  var request = http.get(options);

  request.on('response', function(response) {
    var output = fs.createWriteStream(__dirname + '/test/projects/' + filename);

    switch (response.headers['content-encoding']) {
      case 'gzip':
        response.pipe(zlib.createGunzip()).pipe(output);
        break;
      case 'deflate':
        response.pipe(zlib.createInflate()).pipe(output);
        break;
      default:
        response.pipe(output);
        break;
    }

    response.on('end', function() {
      console.log(filename + " saved.");
    });

  });
};

var projectFetchCallback = function (error, response, body) {
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
};

request({
    url: project_url
}, projectFetchCallback);

