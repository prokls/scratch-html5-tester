var assert = require('assert');
var Yadda = require('yadda');
var phridge = require('phridge');
var English = Yadda.localisation.English;

// TODO: [^"]+ is not scratch compatible
var dict = new Yadda.Dictionary()
    .define('costume', '([^"]+)')
    .define('sprite', '([^"]+)');

module.exports = (function() {
  return English.library(dict)
    .given("loaded project #$NUM", function(number, next) {
      phridge
        .spawn()
        .then(function (phantom) {
          phantom.openPage("http://google.com/").then(function (page) {
            console.log("Loaded");
          });
          /*console.log("Given");
          var page = phantom.createPage();
          page.run(function (resolve, reject) {
            var page = this;

            /*page.onInitialized = function () {
              page.evaluate(function () {
                console.log("evaluate");
                console.log(window);
                //window.AudioContext = function () {}
                //page.injectJs("/home/prokls/scratch-html5-tester/lib/audiomock.js")
              });
            };* /

            this.open("http://google.at", function (status) {
              if (status !== "success")
                  return reject(new Error("Cannot load " + this.url));

              console.log("Loaded");
              resolve();
            });

            /*page.open("lib/scratch-html5/index.html" /*#10000160 * /, function (status) {
              console.log("Opened!");
              assert(status === "success", "HTML5 Scratch player could not load.\nDid you put the scratch-html5 repository into the lib folder?");

              var title = "Scratch MIT";

              assert.notStrictEqual(title.indexOf("Scratch"), -1);
            });* /
          })*/
        })
        .finally(phridge.disposeAll)
        .done(function () { next(); },
          function (err) {
            console.error("Error occured: " + err);
          }
        );
    })
    .when("this sprite clicked", function(next) {
       console.log("When this sprite clicked!");
       // TODO: wait for this brick
       next();
    })
    .then("costume $costume of sprite $sprite is visible", function(costume, sprite, next) {
       console.log("Then");
       console.log("  Costume = " + costume);
       console.log("  Sprite = " + sprite);
       next();
    });
})();


// in given clause:
      /*phridge.spawn()
      .then(function (phantom) {
        
        // TODO: event handling?
        var page = phantom.createPage();
        page.run(function (resolve, reject) {
          console.log("page.run");
          console.log(this.set);
for (var prop in this) {
console.log(prop + "  ==>  ");
}
          this.onResourceRequested = function () {
            console.log(arguments);
          };
          resolve();
        });
      })

      .finally(phridge.disposeAll)
      .done(function () { next(); },
        function (err) {
          console.error("Error occured: " + err);
        }
      );*/


      /*phantom.create(function (ph) {
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

            var title = "Scratch MIT";

            assert.notStrictEqual(title.indexOf("Scratch"), -1);
            ph.exit();
            next();
          });
        });
      });*/
