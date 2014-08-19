/*
 * testsuite.js
 *
 * This file invokes Yadda for every feature file.
 */
var Yadda = require('yadda');

Yadda.plugins.mocha.AsyncStepLevelPlugin.init();

new Yadda.FeatureFileSearch('./test/features').each(function(file) {

  featureFile(file, function(feature) {
    var library = require('./test/steps/scratch-html5');
    var yadda = new Yadda.Yadda(library);

    scenarios(feature.scenarios, function(scenario) {
      steps(scenario.steps, function(step, done) {
        yadda.yadda(step, done);
      });
    });
  });
});

