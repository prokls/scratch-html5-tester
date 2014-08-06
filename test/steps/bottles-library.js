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
          var page = phantom.createPage();
          page.run(function (resolve, reject) {
            var page = this;

            /*page.onInitialized = function () {
              // this is executed 'after the web page is created but before a URL is loaded.
              // The callback may be used to change global objects.' ... according to the docs
              page.evaluate(function () {
                return document.querySelector("h1").innerText;
              });
            };*/

            page.open("http://example.com", function (status) {
              if (status !== "success") {
                return reject();
              }
              page.evaluate(function () {
                console.log(document.querySelector("h1").innerText);
              });
              resolve();
            });
          });
        })
        .finally(phridge.disposeAll)
        .done(function () { console.log("Done. Calling next now."); setTimeout(next, 8000); },
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
