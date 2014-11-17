#!/usr/bin/env node
if(process.argv.length < 3) {
  console.log("Usage:");
  console.log("  ./fetchproject.js #project-id");
  console.log("or");
  console.log("  node fetchproject #project-id");
  process.exit();
}

var projectFetcher = require('./lib/projectfetcher.js');
var projectId      = process.argv[2];

projectFetcher
  .fetchProject(projectId,  __dirname + '/test/projects/')
  .then(function fulfilled(res){
    console.log("Project " + projectId + " has been fetched successfully.");
    console.log(res.length + " file(s) updated." );
  },
  function rejected(error) {
    console.log("Something went wrong.");
    console.log(error);
  }
  );