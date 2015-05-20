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
var fs = require('fs');
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

/**
 * Make everything ready for testsuite run.
 */
function setup() {
  var config = require('./config.json');
  var configfile = fs.openSync(config.log_path, 'w');
  fs.close(configfile);
}

/**
 * Write a final report using the logfile as source.
 */
function teardown() {
  var success = 0, failures = 0, line = null;
  var config = require('./config.json');

  var content = fs.readFileSync(config.log_path).toString('utf-8');
  var lines = content.split(/[\n\r]/);

  log.info("phantomJS terminated. This is my final testsuite report:");

  for (var l in lines) {
    if (lines[l].match('level:failure'))
      failures++;
    else if (lines[l].match('level:ok'))
      success++;
  }

  /*var printMessages = function () {
    log("Successful:");
    for (var m in logged_messages.ok)
      log("  - " + logged_messages.ok[m]);
    log("Failures:");
    for (var m in logged_messages.failure)
      log("  * " + logged_messages.failure[m]);
    log("Warnings:");
    for (var m in logged_messages.warning)
      log("  ! " + logged_messages.warning[m]);
  };*/

  if (success === 0 && failures === 0) {
    log.info("This report does not contain any test results.");
    log.info("Hence it claims, no test has been run.");

  } else if (success === 0 && failures !== 0) {
    log.error("All tests failed ☣ (" + failures + " failed, 0 ok)");
    //log.error("One error was: " +
    //  logged_messages.failure[randomAttribute(logged_messages.failure)]);

  } else if (success !== 0 && failures === 0) {
    log.info("All tests succeeded 😇 ");
    //log.info("For example this means the following features were successful:");
    //for (var feature in msg.report)
    //  log.info("  * " + feature);

  } else if (success !== 0 && failures !== 0) {
    log.info("Some tests succeeded, some failed. ♿");

    //printMessages();

    /*if (successful_features.length !== 0) {
      log.info("The following features have been run completely successfully:");
      // TODO
    }*/
  }
}


before(setup);

/** Invokes Yadda for every feature file */
var count_features = 0;
new Yadda.FeatureFileSearch('./test/features').each(function(file) {
  if (!filtered(file))
    return;
  count_features += 1;

  featureFile(file, function(feature) {
    var library = require('./test/steps/scratch-html5');
    var yadda = new Yadda.Yadda(library);

    if (library.beforeFeature)
      before(library.beforeFeature);

    scenarios(feature.scenarios, function(scenario) {
      if (library.beforeScenario)
        before(library.beforeScenario);
      steps(scenario.steps, function(step, done) {
        var info_stack = {
          'feature': feature.title,
          'scenario': scenario.title,
          'step': step
        };
        yadda.yadda(step, done);
      });
      if (library.afterScenario)
        after(library.afterScenario);
    });

    if (library.afterFeature)
      after(library.afterFeature);
  });
});

if (count_features === 0)
  console.warn("No feature was executed");

after(teardown);

/** The export object is empty, because this is an application, not a library */
module.exports = {};
