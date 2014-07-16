var assert = require('assert');
var phantom = require('phantom');
var English = require('yadda').localisation.English;
var Tester = require('../../lib/scratch-html5-tester/test.js');

module.exports = (function() {
  return English.library()
    .given("loaded project #$NUM", function(number, next) {
       phantom.create(function (ph) {
         ph.createPage(function (page) {
           page.open("http://scratch.mit.edu/", function (status) {
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
    .when("$NUM green bottle accidentally falls", function(number, next) {
       wall.fall(number);
       next();
    })
    .then("there are $NUM green bottles standing on the wall", function(number, next) {
       next();
    });
})();
