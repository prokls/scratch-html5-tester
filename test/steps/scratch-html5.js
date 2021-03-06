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
    console.error("An error occured in phantomjs: " + msg);
    trace.forEach(function (item) {
      console.error("  ", item.file, ": line", item.line);
    });
    reject(new Error("JavaScript execution error"));
  };

  page.onConsoleMessage = function (msg, lineno, sourceid) {
    // browser context, hence `console` instead of `log`
    if (lineno !== undefined && sourceid !== undefined)
      console.error("console output: " + msg + " (line " + lineno + ") in " + sourceid);
    else
      console.info("console output: " + msg);
  };

  page.onCallback = function (msg) {

    // setup logging
    var fs = phantom.createFilesystem();
    var c = fs.open('config.json', {'mode': 'r'}); // TODO: overridability with CLI arguments
    var config = JSON.parse(c.read());
    c.close();

    var logfile = fs.open(config.log_path, {'mode': 'a'});
    var lwrite = function (m) { logfile.writeLine(m); logfile.flush(); };
    var lend = function () { logfile.flush(); logfile.close(); };
    var info = function (m) { console.info(m); lwrite(m); };
    var log = function (m) { console.log(m); lwrite(m); };
    var error = function (m) { console.error(m); lwrite(m); };
    var warn = function (m) { console.warn(m); lwrite(m); };

    // error: unknown type
    if (typeof msg['type'] === 'undefined') {
      var err = 'Invalid message received: ' + JSON.stringify(msg);
      lwrite(err);
      lend();
      throw new Error(err);
    }

    var countObjectAttributes = function (obj) {
      var counter = 0;
      for (var _ in obj)
        counter++;
      return counter;
    };

    var msgtype = msg['type'];
    var userInputEventKeys = ['mousemove', 'click', 'mousedown', 'keydown',
      'mouseup', 'keyup', 'keypress']; 

    switch (msgtype) {
      case 'action':
        if (msg['action'][0] === 'screenshot') {
          var suffix = (msg['action'][1])
                          ? ("" + msg['action'][1])
                          : ("" + Date.now());
          page.render('screenshot-' + suffix + '.png');

        } else if (userInputEventKeys.indexOf(msg['action'][0]) >= 0) {
          page.sendEvent.apply(this, msg['action']);
        }
        break;

      case 'test':
        var path = 'feature? scenario? check?';  // TODO
        var m = path + ": I expected that '" + msg.test.what + "' '"
              + msg.test.expected + '" and this is '
              + (msg.test.state === 'ok' ? 'fine' : "'" + msg.test.actual + "'") + ".";

        log("level:" + msg.test.state);

        if (msg.test.state === 'ok')
          info(m);
        else
          warn(m);
        break;

      case 'finish':
        resolve("Testsuite terminated.");
        break;

      default:
        var errmsg = "Unknown message type received: " + msg['type'];
        logfile.writeLine(errmsg);
        logfile.close();
        throw new Error(errmsg);
    }
  };

  page.onInitialized = function () {
    page.evaluate(function(basepath){
      window.projectbasepath = basepath;
    }, projectbasepath);
    page.injectJs(rootpath + '/utils.js');
    page.injectJs(rootpath + '/message_bus.js');
    page.injectJs(rootpath + '/audiomock.js');
    page.injectJs(rootpath + '/browser.test.js');
    page.injectJs(rootpath + '/browser.load.js');
  };

  var fullpath = 'file://' + rootpath + '/scratch-html5/index.html#' + testcase['id'];
  console.info("Opening URL in phantomjs: " + fullpath);

  // Required. Otherwise loading local resources won't be allowed (Cross-Origin policy)
  page.settings.webSecurityEnabled = false;

  page.open("lib/scratch-html5/index.html#" + testcase['id'], function (status) {
    if (status !== 'success')
      return reject(new Error("Failed to load page " + this.url));

    page.evaluate(function (tc) {
      window.runner.setTestcaseSpec(tc);
      window.runner.wait_for_start();
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
    projectfetcher.fetchProject(test_serialized.id, projectbasepath);
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
    //keyPress feature is not supported in Scratch HTML5 (May 12 2015)
    .when("when $key key pressed", function (key, next) { test.addWhen(['whenKeyPressed', key]); next(); })
    .when("when this sprite clicked", function (next) { test.addWhen(['whenClicked']); next(); })
    .when("when backdrop switches to $backdrop", function (backdrop, next) { test.addWhen(['whenSceneStarts'], backdrop); next(); })
    .when("when $sensor > $numeric", function (sensor, numeric, next) { test.addWhen(['whenSensorGreaterThan', sensor, parseInt(numeric)]); next(); })
    .when('when I receive "$text"', function (text, next) { test.addWhen(['whenIReceive', text]); next(); })
    .when('broadcast "$text"', function (text, next) { test.addWhen(['broadcast:', text]); next(); })
    .when('broadcast "$text" and wait', function (text, next) { test.addWhen(['doBroadcastAndWait', text]); next(); })
    //clone feature is not supported in Scratch HTML5 (May 12 2015)
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
    //keyPress feature is not supported in Scratch HTML5 (May 12 2015)
    .when("user presses $key", function (key, next) { test.addWhen(["userPress", key]); next(); })
    .when("make screenshot( '.*?')?", function (screenshot_name, next) { test.addWhen(["userScreenshot", screenshot_name]); next(); })

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
    .then("backdrop $sprite is visible", function (sprite, next) {
      test.addThen(['backdrop_visible', sprite, true]);
      next();
    })
    .then("backdrop $sprite is hidden", function (sprite, next) {
      test.addThen(['backdrop_visible', sprite, false]);
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

  lib.afterScenario = function (next) {
    run_phantom_js(test.serialize(), next);
  };

  return lib;
})();
