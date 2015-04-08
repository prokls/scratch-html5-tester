/**
 * main.js
 *
 * This file shall be invoked with something like
 *   mocha --reporter spec --file position.feature main.js
 *
 * This invokes mocha as test runner to run only one feature
 * file called position.feature. Yadda will read this feature
 * file and this implementation will build the test and execute
 * it in the phantomjs browser.
 */
var Yadda = require('yadda');
var path = require('path');
var utils = require('./lib/utils.js');

var log = utils.Logger('testsuite');

Yadda.plugins.mocha.StepLevelPlugin.init();


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


/** Invokes Yadda for every feature file */
new Yadda.FeatureFileSearch('./test/features').each(function(file) {
  if (!filtered(file))
    return;

  featureFile(file, function(feature) {
    var library = require('./test/steps/scratch-html5');
    var yadda = new Yadda.Yadda(library);

    if (library.before)
      before(library.before);

    scenarios(feature.scenarios, function(scenario) {
      if (library.beforeScenario)
        before(library.beforeScenario);
      steps(scenario.steps, function(step, done) {
        yadda.yadda(step, done);
      });
      if (library.afterScenario)
        after(library.afterScenario);
    });

    if (library.after)
      after(library.after);
  });
});

/** The export object is empty, because this is an application, not a library */
module.exports = {};
