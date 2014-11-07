#!/usr/bin/env node
"use strict";
var request = require("request");
var fs      = require('fs');
var http    = require('http');
var child_process = require('child_process');

var projectId   = process.argv[2];
var project_url = 'http://cdn.projects.scratch.mit.edu/internalapi/project/' + projectId + '/get/';
var asset_base_host  = 'cdn.assets.scratch.mit.edu';
var asset_base_path  = '/internalapi/asset/';
var asset_path_suffix = '/get/';

var loadAsset = function(filename) {

  var options = {
//      host: asset_base_host,
      hostname: asset_base_host,
      port: 80,
      path: asset_base_path + filename + asset_path_suffix,
      method: 'GET',
  };

//  var pieces = filename.split(".");
//  if(pieces[pieces.length-1] === 'svg') {

//  doesnt work.
//    var file_url = 'http://' + asset_base_host + asset_base_path + filename + asset_path_suffix;
//    child_process.exec('wget ' + file_url + ' -O ./test/projects/' + filename, function(error, stdout, stderr){
//      console.log(error);
//      console.log(stdout);
//      console.log(stderr);
//    });

//  doesnt work (same reason as wget)
//    console.log(file_url);
//
//    request(file_url, function(error, response, body) {
//
//      console.log('svg request...');
//
//      if (!error && response.statusCode === 200) {
//        fs.writeFile(__dirname + '/test/projects/' + filename, body, function(err) {
//          if(err) {
//              console.log(err);
//          } else {
//              console.log(filename + " was saved!");
//          }
//        });
//      } else {
//        console.log(error);
//        console.log(response.statusCode);
//      }
//    });

//  }
//  else {

//    http.get(options, function(res){
    http.get(options, function(res){
      
      var body = '';
      res.setEncoding('ascii');

      res.on('data', function(chunk){
        body += chunk;
      });

      res.on('end', function(){
        console.log(body);

//        fs.writeFile(__dirname + '/test/projects/' + filename, body, 'binary', function(err) {
        fs.writeFile(__dirname + '/test/projects/' + filename, body, function(err) {
            if (err) throw err
            console.log(filename + ' saved.');
        });
      });
    });

//  }
};

var projectFetchCallback = function (error, response, body) {
  if (!error && response.statusCode === 200) {

    //fetch and store assets
    var data = JSON.parse(body);

    loadAsset('647d4bd53163f94a7dabf623ccab7fd3.svg');

//    for(var i = 0; i < data.costumes.length; i++) {
//      loadAsset(data.costumes[i].baseLayerMD5);
//    }
//
//    loadAsset(data.penLayerMD5);
//
//    for(var i = 0; i < data.children.length; i++) {
//      var costumes = data.children[i].costumes;
//      for(var j = 0; j < costumes.length; j++) {
//        loadAsset(costumes[j].baseLayerMD5);
//      }
//    }

    //write file
    fs.writeFile(__dirname + '/test/projects/' + projectId + '.json', body, function(err) {
      if(err) {
          console.log(err);
      } else {
          console.log("The file was saved!");
      }
    });
  }
};

request({
    url: project_url
}, projectFetchCallback);

