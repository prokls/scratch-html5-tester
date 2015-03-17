/*
 * testsuite.js
 *
 * This file invokes Yadda for every feature file.
 */
var Yadda = require('yadda');
var path = require('path');
var utils = require('./lib/utils.js');

var l = utils.Logger('testsuite');

Yadda.plugins.mocha.AsyncStepLevelPlugin.init();


/**
 * If --file (CLI argument) specifies some file and
 * this file is mentioned in the given path,
 * return equivalence. Otherwise true.
 * @param {string} current - A filepath to a possible --file
 * @returns {boolean} if --file equals the parameter, true else false
 */
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

    if (library.before)
      before(library.before);

    scenarios(feature.scenarios, function(scenario) {
      steps(scenario.steps, function(step, done) {
        yadda.yadda(step, done);
      });
    });

    if (library.after)
      after(library.after);
  });
});

