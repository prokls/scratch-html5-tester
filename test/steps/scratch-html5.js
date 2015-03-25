//
// Main implementation of feature-file execution
//

"use strict";

var assert = require('assert');
var request = require('request');
var Yadda = require('yadda');
var phridge = require('phridge');
var English = Yadda.localisation.English;
var path = require('path');
var fs = require('fs');
var utils = require('../../lib/utils.js');

var log = utils.Logger('scratch-html5');

// Testcase object to collect testcase data

var Testcase = function () {
  var projectId;
  var when = {};
  var then = [];
  var currentSprite = "Stage";

  var addProjectId = function (id) {
    projectId = id;
  };

  var addWhen = function (lst) {
    if (when[currentSprite] === undefined) {
      when[currentSprite] = [lst];
    } else {
      when[currentSprite].push(lst);
    }
  };

  var addThen = function (lst) {
    then.push(lst);
  };

  var serialize = function () {
    return {
      'id' : projectId,
      'when' : when,
      'then' : then
    };
  };

  var setCurrentSprite = function(sprite) {
    currentSprite = sprite;
  };

  return { addProjectId : addProjectId, addWhen : addWhen,
         addThen : addThen, serialize : serialize, setCurrentSprite : setCurrentSprite};
};

function run_phridge(rootpath, projectbasepath, testcase, resolve, reject) {
  var page = this;

  page.onError = function (msg, trace) {
    log.error(msg);
    trace.forEach(function (item) {
      log.error("  ", item.file, ": line", item.line);
    });
  };

  page.onConsoleMessage = function (msg, lineno, sourceid) {
    if (lineno !== undefined && sourceid !== undefined)
      log.error("console output: " + msg + " (line " + lineno + ") in " + sourceid);
    else
      log.info("console output: " + msg);
  };

  page.onCallback = function (msg) {

    var userInputEventKeys = ['mousemove', 'click', 'mousedown', 'keydown',
      'mouseup', 'keyup', 'keypress']; 
    var testcaseRunner = ['testcasesFinished'];

    if(userInputEventKeys.indexOf(msg[0]) >= 0) {
      page.sendEvent.apply(this, msg);
    } else if (testcaseRunner.indexOf(msg[0]) >= 0) {
      if (msg[0] === 'testcasesFinished') {
        var report = msg[1];
        var number_of_tcs = "" + report['testcases_done'] + " / "
                            + report['testcases_given'];
        var errors = report.errors;

        if (report.warnings) {
          for (var i = 0; i < report.warnings; i++)
            log.warn(report.warnings[i]);
        }
        if (report.errors) {
          for (var i = 0; i < report.errors; i++) {
            var errmsg = report.errors[i];
            log.error(report.errors[i]);
          }
        }

        if (report.ok) {
          resolve("Testsuite terminated successfully: "
            + number_of_tcs + " ok");
        } else {
          reject(new Error("Error occured. Last error message was: " + errmsg));
        }
      }
//      return page.evaluate(function () { return window.runner.hasFinished(); });
//    }, function () {
//      log.error("testsuite did not finish");
//      reject(new Error("testsuite did not finish within " + (wait_timeout / 1000) + " seconds"));
//    }, wait_timeout);
    } else {
      log.info(msg[0] + " not implemented yet");
    }
  };

  page.onInitialized = function () {
    page.evaluate(function(basepath){
      window.projectbasepath = basepath;
    }, projectbasepath);
    page.injectJs(rootpath + '/audiomock.js');
    page.injectJs(rootpath + '/inbrowser.js');
  };

  page.open("lib/scratch-html5/index.html#" + testcase['id'], function (status) {
    if (status !== 'success')
      return reject(new Error("Failed to load page " + this.url));

    // Call page.evaluate every 250 milliseconds and ask whether
    // runner.hasFinished is true.
    page.evaluate(function (tc) {
      window.runner.receiveTestcaseSpec(tc);
    }, testcase);
  });
}

function run_phantom_js(test_serialized, next) {
  var rootpath        = path.resolve(__dirname, '../../lib');
  var projectbasepath = path.resolve(__dirname + '/../projects');
  var projectjsonfile = projectbasepath + '/' + test_serialized.id + ".json";

  if (!fs.existsSync(projectjsonfile)) {
    var projectfetcher = require('../../lib/projectfetcher.js');
    log.info("Resources for project #" + test_serialized.id + " not available.");
    log.info("Start project fetcher to retrieve data of project #" + test_serialized.id);
    projectfetcher.fetchProject(test_serialized.id, projectbasepath)
  }

  phridge
    .spawn()
    .then(function (phantom) {
      return phantom.createPage();
    })
    .then(function (page) {
      return page.run(rootpath, 'file://' + projectbasepath + '/', test_serialized, run_phridge);
    })
    .finally(phridge.disposeAll)
    .done(
      function () { next(); },
      function (err) { throw err; }
    );
}


// TODO: [^"]+ is not scratch compatible
var dict = new Yadda.Dictionary()
    .define('costume', '([^"]+)')
    .define('sprite', '([^"]+)')
    .define('sound', '([^"]+)')
    .define('list', '([^"]+)')
    .define('variable', '([^"]+)')
    .define('key', '([^"]+)')
    .define('backdrop', '(\w+)')
    .define('numeric', '([0-9]+(\.[0-9]+))')
    .define('text', '([^"]+)')
    .define('sensor', '(loudness|timer|video motion)')  // TODO: refactor
    .define('rotation', '(0|90|-90|180)')
    .define('value', '(^[^#].*)')
    .define('color', '(^#.*)')
    .define('graphiceffect', '(color|fisheye|whirl|pixelate|mosaic|brightness|ghost)');

// motion [_  ]
// value ( )
// text [ ]
// color [X]
// boolean condition < >
// event [^   ]
// control [ <
// operators 

module.exports = (function() {
  
  var test;// = new Testcase();
  var lib = English.library(dict)
    .given("loaded project #$NUM", function(num, next) {
      test = new Testcase();
      test.addProjectId(num);
      next();
    })
    .when("when green flag clicked", function (next) { test.addWhen(['whenGreenFlag']); next(); })
    //.when("block (\w+) is run", function (blockname, next) { test.addWhen(['blockRun', blockname]); next(); })
    //.when("$sprite is clicked", function (spr, next) { test.addWhen(['whenClicked', spr]); next(); }) // custom
    .when("when $key key pressed", function (key, next) { test.addWhen(['whenKeyPressed', key]); next(); })
    .when("when this sprite clicked", function (next) { test.addWhen(['whenClicked']); next(); })
    .when("when backdrop switches to $backdrop", function (backdrop, next) { test.addWhen(['whenSceneStarts'], backdrop); next(); })
    .when("when $sensor > $numeric", function (sensor, numeric, next) { test.addWhen(['whenSensorGreaterThan', sensor, parseInt(numeric)]); next(); })
    .when('when I receive "$text"', function (text, next) { test.addWhen(['whenIReceive', text]); next(); })
    .when('broadcast "$text"', function (text, next) { test.addWhen(['broadcast:', text]); next(); })
    .when('broadcast "$text" and wait', function (text, next) { test.addWhen(['doBroadcastAndWait', text]); next(); })
    .when("when I start as a clone", function (next) { test.addWhen(['whenCloned']); next(); })
    .when("if $cond then", function (cond, next) { test.addWhen(['doIf', cond]); next(); }) // TODO: $cond
    .when("repeat $times", function (times, next) { test.addWhen(['doRepeat', parseInt(times)]); next(); })
    .when("forever", function (next) { test.addWhen(['doForever']); next(); })
    .when("repeat until $cond", function (cond, next) { test.addWhen(['doUntil', cond]); next(); })
    .when("wait $secs secs", function (secs, next) { test.addWhen(['wait:elapsed:from:', parseInt(secs)]); next(); })
    .when("wait until $cond", function (cond, next) { test.addWhen(['doWaitUntil', cond]); next(); })
    .when("create clone of $sprite", function (sprite, next) { test.addWhen(['createCloneOf', sprite]); next(); })
    .when("stop all", function (next) { test.addWhen(['stopScripts', 'all']); next(); })
    .when("stop this script", function (next) { test.addWhen(['stopScripts', 'this script']); next(); })
    .when("stop other scripts in sprite", function (next) { test.addWhen(['stopScripts', 'other scripts in sprite']); next(); })
    .when("delete this clone", function (next) { test.addWhen(['deleteClone']); next(); })
    .when("move $steps steps", function (steps, next) { test.addWhen(['forward:', parseInt(steps)]); next(); })
    .when("turn right $deg degrees", function (deg, next) { test.addWhen(['turnRight:', parseInt(deg)]); next(); })
    .when("turn left $deg degrees", function (deg, next) { test.addWhen(['turnLeft:', parseInt(deg)]); next(); })
    .when("point in direction $rotation", function (rotation, next) { test.addWhen(['heading:', parseInt(rotation)]); next(); })
    .when("point towards mouse pointer", function (next) { test.addWhen(['pointTowards:', '_mouse_']); next(); })
    .when("point towards $sprite", function (sprite, next) { test.addWhen(['pointTowards:', sprite]); next(); })
    .when("go to x:$x y:$y", function (x, y, next) { test.addWhen(['gotoX:y:', parseInt(x), parseInt(y)]); next(); })
    .when("go to mouse pointer", function (next) { test.addWhen(['gotoSpriteOrMouse:', '_mouse_']); next(); })
    .when("go to $sprite", function (sprite, next) { test.addWhen(['gotoSpriteOrMouse:', sprite]); next(); })
    .when("glide $secs secs to x:$x y:$y", function (secs, x, y, next) { test.addWhen(['glideSecs:toX:y:elapsed:from:', parseInt(secs), parseInt(x), parseInt(y)]); next(); })
    .when("change x by $offset", function (offset, next) { test.addWhen(['changeXposBy:', parseInt(offset)]); next(); })
    .when("change y by $offset", function (offset, next) { test.addWhen(['changeYposBy:', parseInt(offset)]); next(); })
    .when("set x to $x", function (x, next) { test.addWhen(['xpos:', parseInt(x)]); next(); })
    .when("set y to $y", function (y, next) { test.addWhen(['ypos:', parseInt(y)]); next(); })
    .when("if on edge, bounce", function (next) { test.addWhen(['bounceOffEdge']); next(); })
    .when("set rotation style all around", function (next) { test.addWhen(['setRotationStyle', 'all around']); next(); })
    .when("set rotation style left-right", function (next) { test.addWhen(['setRotationStyle', 'left-right']); next(); })
    .when("set rotation style don't rotate", function (next) { test.addWhen(['setRotationStyle', "don't rotate"]); next(); })
    //.when("turn motor on for $numeric secs", function (num, next) { test.addWhen(['setRotationStyle']); next(); })
    //.when("turn motor on", function (next) { test.addWhen(['setRotationStyle']); next(); })
    //.when("turn motor off", function (next) { test.addWhen(['']); next(); })
    //.when("set motor power $numeric", function (next) { test.addWhen(['']); next(); })
    //.when("set motor direction this way", function (next) { test.addWhen(['']); next(); })
    //.when("set motor direction that way", function (next) { test.addWhen(['']); next(); })
    //.when("set motor direction reverse", function (next) { test.addWhen(['']); next(); })
    .when("switch costume to $costume", function (costume, next) { test.addWhen(['lookLike:', costume]); next(); })
    .when("switch backdrop to $costume", function (costume, next) { test.addWhen(['startScene', costume]); next(); })
    .when("switch backdrop to $costume and wait", function (costume, next) { test.addWhen(['startSceneAndWait']); next(); })
    .when("next costume", function (next) { test.addWhen(['nextCostume']); next(); })
    .when("next backdrop", function (next) { test.addWhen(['nextScene']); next(); })
    .when('say "$text" for $secs seconds', function (text, secs, next) { test.addWhen(['say:duration:elapsed:from:']); next(); })
    .when('say "$text"', function (text, next) { test.addWhen(['say:']); next(); })
    .when('think "$text" for $secs seconds', function (text, secs, next) { test.addWhen(['think:duration:elapsed:from:', text, parseInt(secs)]); next(); })
    .when('think "$text"', function (text, next) { test.addWhen(['think:', text]); next(); })
    .when('change $graphiceffect effect by $num', function (graphiceffect, num, next) { test.addWhen(['changeGraphicEffect:by:', graphiceffect, parseInt(num)]); next(); })
    .when('set $graphiceffect effect to $num', function (graphiceffect, num, next) { test.addWhen(['setGraphicEffect:to:', graphiceffect, num]); next(); })
    .when('clear graphic effects', function (next) { test.addWhen(['filterReset']); next(); })
    .when('change size by $offset', function (offset, next) { test.addWhen(['changeSizeBy:', parseInt(offset)]); next(); })
    .when("set size to $size", function (size, next) { test.addWhen(["setSizeTo:", parseInt(size)]); next(); })
    .when("show", function (next) { test.addWhen(["show"]); next(); })
    .when("hide", function (next) { test.addWhen(["hide"]); next(); })
    .when("go to front", function (next) { test.addWhen(["comeToFront"]); next(); })
    .when("go back $count layers", function (count, next) { test.addWhen(["goBackByLayers:", parseInt(count)]); next(); })
    .when("play sound $sound", function (sound, next) { test.addWhen(["playSound:", sound]); next(); })
    .when("play sound $sound until done", function (sound, next) { test.addWhen(["doPlaySoundAndWait", sound]); next(); })
    .when("stop all sounds", function (next) { test.addWhen(["stopAllSounds"]); next(); })
    .when("play drum $drum for $beats beats", function (drum, beats, next) { test.addWhen(["playDrum", parseInt(drum), parseInt(beats)]); next(); })
    .when("rest for $beats beats", function (beats, next) { test.addWhen(["rest:elapsed:from:", parseInt(beats)]); next(); })
    .when("play note $note for $beats beats", function (note, beats, next) { test.addWhen(["noteOn:duration:elapsed:from:", note, beats]); next(); })
    .when("set instrument to $instr", function (instr, next) { test.addWhen(["instrument:", parseInt(instr)]); next(); })
    .when("change volume by $vol", function (vol, next) { test.addWhen(["changeVolumeBy:", parseInt(vol)]); next(); })
    .when("set volume to $vol", function (vol, next) { test.addWhen(["setVolumeTo:", vol]); next(); })
    .when("change tempo by $tempo", function (tempo, next) { test.addWhen(["changeTempoBy:", parseInt(tempo)]); next(); })
    .when("set tempo to $tempo bpm", function (tempo, next) { test.addWhen(["setTempoTo:", parseInt(tempo)]); next(); })
    .when("set video transparency to $trans", function (trans, next) { test.addWhen(["setVideoTransparency", parseInt(trans)]); next(); })
    .when('ask "$text" and wait', function (text, next) { test.addWhen(["doAsk", text]); next(); })
    .when("reset timer", function (next) { test.addWhen(["timerReset"]); next(); })
    .when("turn video on", function (next) { test.addWhen(["setVideoState", 'on']); next(); })
    .when("turn video off", function (next) { test.addWhen(["setVideoState", 'off']); next(); })
    .when("turn video on-flipped", function (next) { test.addWhen(["setVideoState", 'on-flipped']); next(); })
    .when("clear", function (next) { test.addWhen(["clearPenTrails"]); next(); })
    .when("pen down", function (next) { test.addWhen(["putPenDown"]); next(); })
    .when("pen up", function (next) { test.addWhen(["putPenUp"]); next(); })
    .when("stamp", function (next) { test.addWhen(["stampCostume"]); next(); })
    .when("set pen color to $color", function (color, next) { test.addWhen(["penColor:", color]); next(); })
    .when("change pen color by $color", function (color, next) { test.addWhen(["changePenHueBy:", color]); next(); })
    //.when("set pen color to $color", function (color, next) { test.addWhen(["setPenHueTo:", color]); next(); }) // TODO: intersects with other definition
    .when("change pen shade by $shade", function (shade, next) { test.addWhen(["changePenShadeBy:", shade]); next(); })
    .when("set pen shade to $shade", function (shade, next) { test.addWhen(["setPenShadeTo:"], shade); next(); })
    .when("change pen size by $size", function (size, next) { test.addWhen(["changePenSizeBy:", size]); next(); })
    .when("set pen size to $size", function (size, next) { test.addWhen(["penSize:", size]); next(); })
    .when("change $variable by $val", function (variable, val, next) { test.addWhen(["changeVar:by:", variable, val]); next(); })
    .when("set $variable to $val", function (variable, val, next) { test.addWhen(["setVar:to:", variable, val]); next(); })
    .when("hide variable $variable", function (variable, next) { test.addWhen(["hideVariable:", variable]); next(); })
    .when("show variable $variable", function (variable, next) { test.addWhen(["showVariable:", variable]); next(); })
    .when("add $text to list $list", function (text, list, next) { test.addWhen(["append:toList:", text, list]); next(); })
    .when("delete 1 of $list", function (list, next) { test.addWhen(["deleteLine:ofList:", '1', list]); next(); })
    .when("delete last of $list", function (list, next) { test.addWhen(["deleteLine:ofList:", 'last', list]); next(); })
    .when("delete all of $list", function (list, next) { test.addWhen(["deleteLine:ofList:", 'all', list]); next(); })
    .when("insert $text at 1 of $list", function (text, list, next) { test.addWhen(["insert:at:ofList:", '1', text, list]); next(); })
    .when("insert $text at last of $list", function (text, list, next) { test.addWhen(["insert:at:ofList:", 'last', text, list]); next(); })
    .when("insert $text at random of $list", function (text, list, next) { test.addWhen(["insert:at:ofList:", 'random', text, list]); next(); })
    .when("replace item 1 of $list with $text", function (list, text, next) { test.addWhen(["setLine:ofList:to:", '1', text, list]); next(); })
    .when("replace item last of $list with $text", function (list, text, next) { test.addWhen(["setLine:ofList:to:", 'last', text, list]); next(); })
    .when("replace item random of $list with $text", function (list, text, next) { test.addWhen(["setLine:ofList:to:", 'random', text, list]); next(); })
    .when("show list $list", function (list, next) { test.addWhen(["showList:", list]); next(); })
    .when("hide list $list", function (list, next) { test.addWhen(["hideList:", list]); next(); })
    .when("using $sprite", function (sprite, next) { test.setCurrentSprite(sprite); next(); })
    .when("user points to sprite $sprite", function (sprite, next) { test.addWhen(["userPointToSprite", sprite]); next(); })
    .when("user clicks", function (next) { test.addWhen(["userClick"]); next(); })

    .then("costume $costume of sprite $sprite is at x:$xpos y:$ypos", function (costume, sprite, xpos, ypos, next) {
      test.addThen(['position', costume, sprite, parseInt(xpos), parseInt(ypos)]);
      next();
    })
    .then("costume $costume of sprite $sprite is hidden", function (costume, sprite, next) {
      test.addThen(['hidden', costume, sprite]);
      next();
    })
    .then("costume $costume of sprite $sprite is visible", function (costume, sprite, next) {
      test.addThen(['visible', costume, sprite]);
      next();
    })
    .then("sprite $sprite is visible", function (sprite, next) {
      test.addThen(['sprite_visible', sprite]);
      next();
    })
    .then("backdrop $backdrop is visible", function (sprite, next) {
      test.addThen(['sprite_visible', sprite]);
      next();
    })
    .then("sprite $sprite is hidden", function (sprite, next) {
      test.addThen(['sprite_hidden', sprite]);
      next();
    })
    .then("costume $costume of sprite $sprite has size $size percent", function (costume, sprite, size, next) {
      test.addThen(['size_percentage', costume, sprite, parseInt(size)]);
      next();
    })
    .then("costume $costume of sprite $sprite has size width:$width height:$height", function (costume, sprite, width, height, next) {
      test.addThen(['size', costume, sprite, parseInt(width), parseInt(height)]);
      next();
    })
    .then("costume $costume of sprite $sprite is rotated by $rot degrees", function (costume, sprite, rot, next) {
      test.addThen(['rotation', costume, sprite, parseInt(rot)]);
      next();
    })
    .then("variable $variable is $val", function (variable, val, next) {
      test.addThen(['variable', 'Stage', variable, val]);
      next();
    });

  lib.after = function (next) {
    run_phantom_js(test.serialize(), next);
  };

  return lib;
})();
