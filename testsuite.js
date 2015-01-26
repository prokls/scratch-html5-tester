/*
 * testsuite.js
 *
 * This file invokes Yadda for every feature file.
 */
var Yadda = require('yadda');
var path = require('path');

Yadda.plugins.mocha.AsyncStepLevelPlugin.init();

function filtered(current) {
  for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] == '--file') {
      var path1 = path.resolve(__dirname, process.argv[i + 1]);
      var path2 = path.resolve(__dirname, path.basename(current));
      return path1 == path2;
    }
  }
  return true;
}


new Yadda.FeatureFileSearch('./test/features').each(function(file) {

  if (!filtered(file))
    return;

  featureFile(file, function(feature) {
    var library = require('./test/steps/scratch-html5');
    var yadda = new Yadda.Yadda(library);

    scenarios(feature.scenarios, function(scenario) {
      scenario.steps.push("then run phantomjs");

      steps(scenario.steps, function(step, done) {
        yadda.yadda(step, done);
      });
    });
  });
});

