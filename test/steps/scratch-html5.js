var assert = require('assert');
var request = require('request');
var Yadda = require('yadda');
var phridge = require('phridge');
var English = Yadda.localisation.English;
var path = require('path');
var number;

// TODO: [^"]+ is not scratch compatible
var dict = new Yadda.Dictionary()
    .define('costume', '([^"]+)')
    .define('sprite', '([^"]+)');

module.exports = (function() {
  return English.library(dict)
    .given("loaded project #$NUM", function(number1, next) {
        number = number1;
        next();
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
       var jsonsrc = "http://projects.scratch.mit.edu/internalapi/project/"+number+"/get/";

       var costumeFileMap = new Array();
       request(jsonsrc, function (error, response, body) {
           if (!error && response.statusCode == 200) {
             //console.log(JSON.parse(body)); 
             var obj = JSON.parse(body);
             obj.children.forEach(function(entry) {
                 //console.log(entry.objName);
                 costumeFileMap[entry.objName] = new Array();
                 //console.log(entry.costumes);
                 entry.costumes.forEach(function(entry1) {
                     costumeFileMap[entry.objName][entry1.costumeName] = entry1.baseLayerMD5;
                 });
                    
             });
             console.log(costumeFileMap);
           }
         });
       
       
       
       return phridge.spawn()
       .then(function (phantom) {
         return phantom.createPage();
       })

       .then(function (page) {
         var ac_path = path.resolve(__dirname, '../../lib/audiomock.js');
         var rootpath = path.resolve(__dirname, '../../lib');
         return page.run(number, ac_path, rootpath,
           function (number, ac_path, rootpath, resolve, reject) {
           var page = this;

           page.onError = function (msg, trace) {
             console.error(msg);
             trace.forEach(function (item) {
               console.log("  ", item.file, ": line", item.line);
             });
           };

           page.onConsoleMessage = function (msg, lineno, sourceid) {
             if (lineno !== undefined && sourceid !== undefined)
               console.log("console output: " + msg + " (line " + lineno + ") in " + sourceid);
             else
               console.log("console output: " + msg);
           };

           page.onInitialized = function () {
             page.injectJs(ac_path);
           };

           return page.open("lib/scratch-html5/index.html#" + number, function (status) {
             return resolve(page.evaluate(function () {
               return document.querySelector("h1").innerText;
             }));
           });
         });
       })

       .finally(phridge.disposeAll)
       .done(function (text) {
         console.log("Headline on index.html: '%s'", text);
         next();
       }, function (err) {
         throw err;
       });
       

    });
})();

