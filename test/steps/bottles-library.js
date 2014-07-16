var assert = require('assert');
var phantom = require('phantom');
var Yadda = require('yadda');
var English = Yadda.localisation.English;
var Tester = require('../../lib/scratch-html5-tester/test.js');

// TODO: [^"]+ is not scratch compatible
var dict = new Yadda.Dictionary()
    .define('costume', '([^"]+)')
    .define('sprite', '([^"]+)');

module.exports = (function() {
  return English.library(dict)
    .given("loaded project #$NUM", function(number, next) {
       phantom.create(function (ph) {
         ph.createPage(function (page) {
           page.open("file:///home/prokls/scratch-html5/index.html#" + number, function (status) {
             page.evaluate(function () { return document.title; }, function (result) {
               assert.notStrictEqual(result.indexOf("Scratch"), -1);
               ph.exit();
               next();
             });
           });
         });
       });
       wall = new Tester(number);
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
