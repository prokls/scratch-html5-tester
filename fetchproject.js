#!/usr/bin/env node
if(process.argv.length < 3) {
  console.log("Usage:");
  console.log("  ./fetchproject.js #project-id");
  console.log("or");
  console.log("  node fetchproject #project-id");
  process.exit();
}

var projectFetcher    = require('./lib/projectfetcher.js');
var projectId         = process.argv[2];
var projectsDirectory =  __dirname + '/test/projects/';

projectFetcher
  .fetchProject(projectId, projectsDirectory)
  .then(function fulfilled(res){
    console.log("Project " + projectId + " has been fetched successfully.");
    console.log(res.length + " file(s) updated." );
  },
  function rejected(error) {
    console.log("Something went wrong:");
    console.log(error);
    if(error.code == 'ENOENT') {
      console.log('Hint: Make sure that ' + projectsDirectory + ' exists and is writeable.');
    }
  }
  );