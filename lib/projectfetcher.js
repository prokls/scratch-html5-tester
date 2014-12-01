var Q           = require('q');
var fs          = require('fs');
var zlib        = require('zlib');
var http        = require('http');
var request     = require('request');
var promisepipe = require('promisepipe');

var project_base_host   = 'http://cdn.projects.scratch.mit.edu/internalapi/project/';
var project_base_suffix = '/get/';
var asset_base_host     = 'cdn.assets.scratch.mit.edu';
var asset_base_path     = '/internalapi/asset/';
var asset_path_suffix   = '/get/';
var projects_directory;

/*
 * Fetch scratch project resources from MIT server
 * @param {int}    projectId
 * @param {string} projectsDirectory
 * @returns {promise a/+ compliant object}
 */

exports.fetchProject = function(projectId, projectsDirectory){

  var project_url = project_base_host + projectId + project_base_suffix;
  projects_directory = projectsDirectory || __dirname + '/';

  return Q.nfcall(request, {url: project_url})
      .then(function(res){
        return {body : res[1], projectId : projectId};
      })
      .then(handleProjectJsonResponse);
};

var handleProjectJsonResponse = function(args) {
  var body      = args.body;
  var projectId = args.projectId;

  var data = JSON.parse(body);
  var promises = [];

  for(var i = 0; i < data.costumes.length; i++) {
    promises.push(loadAsset(data.costumes[i].baseLayerMD5));
  }

  promises.push(loadAsset(data.penLayerMD5));

  for(var i = 0; i < data.children.length; i++) {
    var costumes = data.children[i].costumes || [];
    for(var j = 0; j < costumes.length; j++) {
      promises.push(loadAsset(costumes[j].baseLayerMD5));
    }
  }

  promises.push(
    Q.nfcall(fs.writeFile, projects_directory + projectId + '.json', body)
      .then(function(){return projectId + '.json';})
  );

  return Q.all(promises);
};

var loadAsset = function(filename) {
  var options = {
    hostname: asset_base_host,
    port:     80,
    path:     asset_base_path + filename + asset_path_suffix
  };

  //used approach: https://github.com/kriskowal/q/issues/376
  var httpGetPromise = Q.defer();
  http.get(options, httpGetPromise.resolve);
  
  return httpGetPromise.promise
      .then(function(response){
        var output = fs.createWriteStream(projects_directory + filename);
        switch (response.headers['content-encoding']) {
          case 'gzip':
            return promisepipe(response, zlib.createGunzip(), output);
          case 'deflate':
            return promisepipe(response, zlib.createInflate(), output);
          default:
            return promisepipe(response, output);
        }
      })
      .then(function() {
        return filename;
      });
};
