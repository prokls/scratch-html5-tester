var assert = require('assert');
var phantom = require('phantom');
var Yadda = require('yadda');
var English = Yadda.localisation.English;

// TODO: [^"]+ is not scratch compatible
var dict = new Yadda.Dictionary()
    .define('costume', '([^"]+)')
    .define('sprite', '([^"]+)');

module.exports = (function() {
  return English.library(dict)
    .given("loaded project #$NUM", function(number, next) {
      phantom.create(function (ph) {
        ph.createPage(function (page) {
          //page.set('settings.webSecurityEnabled', false);
          page.set('onInitialized', function () {
            console.log("Before calling injectJs");
            if (!page.injectJs("/home/prokls/scratch-html5-tester/lib/audiomock.js"))
              console.error("Injection failed!");
            else
              console.log("Injection successful!");
            console.log("After calling injectJs");
          });
          page.open("lib/scratch-html5/index.html#" + number, function (status) {
            assert(status === "success", "HTML5 Scratch player could not load.\nDid you put the scratch-html5 repository into the lib folder?");

            /*var title = page.evaluate(function () {
                return document.title;
            });*/
            var title = "Scratch MIT";

            assert.notStrictEqual(title.indexOf("Scratch"), -1);
            ph.exit();
            next();
          });
        });
      });
    })
    .when("this sprite clicked", function(next) {
       console.log("when this sprite clicked!");
       // TODO: wait for this brick
       next();
    })
    .then("costume $costume of sprite $sprite is visible", function(costume, sprite, next) {
       console.log("Costume = " + costume);
       console.log("Sprite = " + sprite);
       next();
    });
})();
