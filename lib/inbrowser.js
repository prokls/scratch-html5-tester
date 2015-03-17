var normalizeSpriteName = function (v) {
  return ("" + v).trim();
}

var normalizeCostumeName = function (v) {
  return ("" + v).trim();
}

var MessageBus = function () {
  var listeners = [];

  var send = function (obj) {
    if (typeof window.callPhantom === 'function')
      window.callPhantom(obj);
    else
      throw new Error("PhantomJS onCallback not available");
  };

  var listen = function (clbk) {
    listeners.add(clbk);
  };

  var receive = function (msg) {
    for (var i = 0; i < listeners.length; i++)
      listeners[i](msg);
  };

  return { send : send, listen : listen, receive : receive };
};

var TestFrameworkRunner = function () {
  var project_json;
  var project_id;
  var blockseq;
  var testcase_spec = null;
  var run_load_start_yourself = false;
  var costume_file_map;
  var last_error_msg = '';
  var msg = new MessageBus();

  var checkArguments = function(whenlist, arguments) {
    for(i = 1;i < whenlist[0].length;i++) {
      if(whenlist[0][i] != normalizeCostumeName(arguments.args[i - 1])) {
        console.log("Wrong Arguments: expected: -" + whenlist[0][i] +
                    "- seen: -" + arguments.args[i - 1] + "-");
        return false;
      }
    }
    return true;
  };

  var executeUserInteraction = function (input) {

      // Input:
      //   ['userPointTo', x, y]
      //   ['userPointToSprite', sprite]
      //   ['userClick']
      //   ['userPress', key or 'mousebutton']
      //   ['userRelease', key or 'mousebutton']
      //   ['userType', string]

      switch (input[0]) {
        case 'userPointTo':
          msg.send(['mousemove', input[1], input[2]]);
          break;
        case 'userPointToSprite':
          var sprite = input[1];
          var costume = getVisibleCostume(sprite);
          var pos = getCostumePosition(costume, sprite);
          msg.send(['mousemove', pos[0], pos[1]]);
          break;
        case 'userClick':
          msg.send(['click']);
          break;
        case 'userPress':
          if(input[1] === 'mousebutton')
            msg.send(['mousedown']);
          else
            msg.send(['keydown', input[1]]);
          break;
        case 'userRelease':
          if(input[1] === 'mousebutton')
            msg.send(['mouseup']);
          else
            msg.send(['keyup', input[1]]);
          break;
        case 'userType':
          for (var l = 0; l < input[1].length; l++)
            msg.send(['keypress', input[1][l]]);
          break;
      }

      // Output:
      //   ['mousemove', x, y]
      //   ['click']
      //   ['mousedown']
      //   ['keydown', key]
      //   ['mouseup']
      //   ['keyup', key]
      //   ['keypress', key]
      //
      // eg.
      //   ['mousemove', 450, 150]
      //   ['click']
      //   ['mousedown']
      //   ['keydown'  , 'a']
      //   ['mouseup']
      //   ['keyup'    , 'a']
      //   ['keypress' , 'a']
  };

  var executeUserInteractionInAllSprites = function () {
    for (var sprite in blockseq)
      executeUserInteraction(sprite);
  };

  var blockExecuted = function (block_counter, blockname, arguments) {

    if (block_counter === 0)
    {
      blockseq[target]
    }

    // internal blocks (like timerReset) do not have a target
    if(interp.activeThread.target === undefined) {
      return;
    }

    var target = interp.activeThread.target.objName;

    if (blockseq[target] !== undefined
            && blockseq[target].length
            && blockseq[target][0][0] === blockname
    ) {

      if(checkArguments(blockseq[target], arguments)) {

        blockseq[target].shift();

        // if user interaction block
        //   remove user interaction block
        //   send message to process outside phantomjs
        while (blockseq[target].length 
                && blockseq[target][0].length
                && blockseq[target][0][0].substr(0, 4) === "user") {
          var input = blockseq[target].shift();
          executeUserInteraction(input);
        }
        
        console.log("block of name " + blockname + " executed" + (arguments == undefined ? "" : ", argument: " + arguments.args));

        for(var sprite in blockseq) {
          if(blockseq[sprite].length > 0) {
            console.log("Still expecting blocks " + JSON.stringify(blockseq));
            return;
          }
        }

        checkThen();
        return;
      }
    }

    // else - not interested in block
    if(blockname != "wait:elapsed:from:") {
      console.log("Uninteresting block of name " + blockname + " executed" + (arguments == undefined ? "" : ", argument: " + arguments.args));
      console.log("Still expecting blocks " + JSON.stringify(blockseq));
    }

  };

  var isTestcaseSpecAvailable = function () {
    return (testcase_spec !== null);
  };

  var receiveTestcaseSpec = function (spec) {
    testcase_spec = spec;

    if (run_load_start_yourself)
      start();
  };

  var determineFilename = function () {
    costume_file_map = {};

    project_json.children.forEach(function (entry) {
      if(entry.objName !== undefined) {
        var sprite_name = normalizeSpriteName(entry.objName);
        costume_file_map[sprite_name] = {};
        entry.costumes.forEach(function (entry1) {
          var costume_name = normalizeCostumeName(entry1.costumeName);
          costume_file_map[sprite_name][costume_name] = entry1.baseLayerMD5;
        })
      }
    })
  };

  var analyzeProjectJSON = function () {
    determineFilename();
  };

  var start = function () {
    // test sane initialization
    if (typeof io === 'undefined')
      throw new Error("Could not initialize Scratch-HTML5 player properly");

    // retrieve project ID
    project_json = io.data;
    project_id = testcase_spec['id'];

    console.debug("About to start Scratch project #" + project_id);

    blockseq = testcase_spec['when'];

    console.debug("I am expecting the following blocks for When statements: " + JSON.stringify(blockseq));

    // retrieve data from project.json
    analyzeProjectJSON();

    // trigger "whenGreenFlag"
    setTimeout(function () { $("#overlay").click() }, 500);
  };

  var getSprite = function (sprite) {
    var sprite_obj = costume_file_map[normalizeSpriteName(sprite)];
    if(sprite_obj === undefined) {
      throw new Error("Sprite " + sprite + " does not exist!");
    }
    return sprite_obj;
  }

  var getCostumeByFilename = function(filename) {
    var found = null;
    $("img").each(function () {
      if ($(this).attr("src").indexOf(filename) !== -1)
        found = $(this);
    });
    if (!found)
      throw new Error("Expected costume with filename " + filename
        + " does not exist");
    return found;
  };

  var getCostume = function(costume, sprite) {
    var sprite_obj = getSprite(sprite);
    var filename = sprite_obj[normalizeCostumeName(costume)];
    var found = getCostumeByFilename(filename);
    return found;
  };

  var checkVisible = function (costume, sprite) {
    var found = getCostume(costume, sprite);
    if (!found.is(":visible"))
      throw new Error("Expected costume " + costume + " of " + sprite + " to be visible, but is not");
  };

  var checkHidden = function (costume, sprite) {
    found = getCostume(costume, sprite);
    if (found.is(":visible"))
      throw new Error("Expected costume " + costume + " of " + sprite + " to be hidden, but is not");
  };

  var checkSpriteVisible = function (sprite, visible) {
    var sprite_obj = getSprite(sprite);
    for(var costume in sprite_obj) {
      var filename = sprite_obj[normalizeCostumeName(costume)];
      var found = getCostumeByFilename(filename);
      if (found.is(":visible")) {
        if(!visible)
          throw new Error("Expected sprite " + sprite + " to be hidden, " +
          "but costume " + costume + " is visible");
        return;
      }
    }
    if(visible)
      throw new Error("Expected sprite " + sprite + " to be visible, but is not");
  }

  var checkPosition = function (costume, sprite, x, y) {
    console.log("check for x:" + x + " and y:" + y);

    // object
    var found = getCostume(costume, sprite);
    var offset = found.offset();
    var c_x = Math.floor(found.width() / 2);
    var c_y = Math.floor(found.height() / 2);

    // canvas
    var canvas = $("#container canvas").offset();
    var center_x = offset.left - canvas.left + c_x;
    var center_y = offset.top - canvas.top + c_y;

    // use Scratch coordinate system
    center_x -= Math.floor($("#container canvas").width() / 2);
    center_y = -center_y + Math.floor($("#container canvas").height() / 2);

    var check = (center_x <= x && x <= center_x + 1 &&
                 center_y <= y && y <= center_y + 1);

    if (!check)
      throw new Error("Expected costume " + costume + " of " + sprite
        + " to be centered at point " + center_x + ","
        + center_y + " but is at " + x + "," + y);
  };

  var getVisibleCostume = function (sprite) {
    var sprite_obj = getSprite(sprite);
    for(var costume in sprite_obj) {
      var filename = sprite_obj[normalizeCostumeName(costume)];
      var found = getCostumeByFilename(filename);
      if (found.is(":visible"))
        return costume;
    }
    return null;
  };

  var getCostumePosition = function (costume, sprite) {
    var found = getCostume(costume, sprite);
    var offset = found.offset();
    var c_x = Math.floor(found.width() / 2);
    var c_y = Math.floor(found.height() / 2);
    return [offset.left + c_x, offset.top + c_y];
  };

  var getTransformValue = function(element, property) {
    var values = element.attr("style").split(")");
    for (var key in values) {
      var val = values[key];
      var prop = val.split("(");
      if (prop[0].trim() == property)
        return prop[1];
    }
    return false;
  };

  var checkSizePercent = function(costume, sprite, size) {
    var found = getCostume(costume, sprite);
    var scale = getTransformValue(found, "scaleX");

    if(size !== scale * 100) {
      throw new Error("Expected size of costume/sprite " + costume +
        "/" + sprite + ": " + size + "%, Current: " + scale * 100 + "%");
    }
  };

  var checkRotation = function(costume, sprite, rot) {
    var found = getCostume(costume, sprite);
    var rotation = getTransformValue(found, "rotate");
    console.log("ROTATION: " + rotation);
    console.log("int: " + parseInt(rotation.replace("deg","")));
    console.log("rot: " + rot);
    if(rot !== parseInt(rotation.replace("deg",""))) {
      throw new Error("Expected rotation of costume/sprite " + costume +
        "/" + sprite + ": " + rot + "deg, Current: " + rotation);
    }
  };

  var checkSize = function(costume, sprite, width, height) {
    var found = getCostume(costume, sprite);
    var curr_height = found.height();
    console.log("Height: " + curr_height);
    var curr_width = found.width();
    console.log("Width: " + curr_width);

    if(curr_height !== height || curr_height !== height) {
    throw new Error("Expected size of costume/sprite " + costume +
      "/" + sprite + ": Width" + width + ", Height: " + height +
      "\r\n" + "Current: Width: " + curr_width + ", Height: " +
      curr_height);
    };
  };

  var checkVariable = function(sprite, variable, value) {
    var target = runtime.spriteNamed(sprite);
    // Stage = global scope, otherwise name of the Sprite

    var curr_value = target.variables[variable];
    if(curr_value == undefined) {
      throw new Error("Variable " + variable + " not found in global scope!");
    }
    if(curr_value != value) {
      throw new Error("Expected value " + value + " for variable " +
                      variable + " current value: " + curr_value);
    }
  };

  var checkThen = function () {
    var count = {'success': 0, 'failure': 0};
    try {
      for (var i in testcase_spec['then']) {
        switch (testcase_spec['then'][i][0]) {
          case 'visible':
            console.log("visible test...");
            checkVisible(testcase_spec['then'][i][1], testcase_spec['then'][i][2]);
            break;
          case 'sprite_visible':
            console.log("sprite visible test...");
            checkSpriteVisible(testcase_spec['then'][i][1], true);
            break;
          case 'sprite_hidden':
            console.log("sprite hidden test...");
            checkSpriteVisible(testcase_spec['then'][i][1], false);
            break;
          case 'hidden':
            console.log("hidden test...");
            checkHidden(testcase_spec['then'][i][1], testcase_spec['then'][i][2]);
            break;
          case 'position':
            console.log("position test...");
            checkPosition(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                          testcase_spec['then'][i][3], testcase_spec['then'][i][4]);
            break;
          case 'size_percentage':
            console.log("size_percentage test");
            checkSizePercent(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                             testcase_spec['then'][i][3]);
            break;
          case 'size':
            console.log("size test");
            checkSize(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                      testcase_spec['then'][i][3], testcase_spec['then'][i][4]);
            break;
          case 'rotation':
            console.log("rotation test");
            checkRotation(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                          testcase_spec['then'][i][3]);
            break;
          case 'variable':
            console.log("variable test");
            checkVariable(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                          testcase_spec['then'][i][3]);
            break;

        }
        count['success'] += 1;
      }
    } catch (e) {
      last_error_msg = e.message;
      count['failure'] += 1;
    }

    msg.send(['testcasesFinished', {
      'testcases_done' : count['success'] + count['failure'],
      'testcases_given' : testcase_spec['then'].length,
      'errors' : (last_error_msg ? [last_error_msg] : []),
      'ok' : count['failure'].length === 0
    }]);
  };

  return {
    start : start,
    blockExecuted : blockExecuted,
    isTestcaseSpecAvailable : isTestcaseSpecAvailable,
    receiveTestcaseSpec : receiveTestcaseSpec,
    lastErrorMessage : function () { return last_error_msg; }
  };
}

/*!
 * contentloaded.js
 *
 * Author: Diego Perini (diego.perini at gmail.com)
 * Summary: cross-browser wrapper for DOMContentLoaded
 * Updated: 20101020
 * License: MIT
 * Version: 1.2
 *
 * URL:
 * http://javascript.nwbox.com/ContentLoaded/
 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
 *
 */

// @win window reference
// @fn function reference
function contentLoaded(win, fn) {
  var done = false,
      top = true;

  var doc = win.document,
      root = doc.documentElement,
      modern = doc.addEventListener;

  var add = modern ? 'addEventListener' : 'attachEvent',
      rem = modern ? 'removeEventListener' : 'detachEvent',
      pre = modern ? '' : 'on';

  var init = function(e) {
    if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
    (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
    if (!done && (done = true)) fn.call(win, e.type || e);
  };

  var poll = function() {
    try {
      root.doScroll('left');
    } catch(e) {
      setTimeout(poll, 50);
      return;
    }
    init('poll');
  };

  if (doc.readyState == 'complete')
    fn.call(win, 'lazy');
  else {
    if (!modern && root.doScroll) {
      try { top = !win.frameElement; } catch(e) { }
      if (top) poll();
    }
    doc[add](pre + 'DOMContentLoaded', init, false);
    doc[add](pre + 'readystatechange', init, false);
    win[add](pre + 'load', init, false);
  }
};

function rewrite(name, primitiveTable, clbk) {
  var _old = primitiveTable[name];
  primitiveTable[name] = function (b) {
    _old.apply(primitiveTable, [b]);
    clbk(name, b);
  };
}

contentLoaded(window, function () {

  var IOMock = function() {
    this.data = null;
    this.project_base = window.projectbasepath;
    this.project_suffix = '.json';
    this.asset_base = window.projectbasepath;
    this.asset_suffix = '';
    this.soundbank_base = 'soundbank/';
    this.spriteLayerCount = 0;
  };

  var _oldIOprototype = window.IO.prototype;
  window.IO = IOMock;
  window.IO.prototype = _oldIOprototype;

  window.IO.prototype.soundRequest = function(sound, sprite) {
    sprite.soundsLoaded++;
  };

  // initialize runner object
  window.runner = new TestFrameworkRunner();

  // override block operations with itself and call callback in runner object
  var executed_block_id = 0;
  var _oldInitPrims = Interpreter.prototype.initPrims;
  Interpreter.prototype.initPrims = function () {
    _oldInitPrims.apply(this, arguments);

    for (var blockname in this.primitiveTable) {
      var name = blockname.toString();
      rewrite(name, this.primitiveTable, function (block, arguments) {
        runner.blockExecuted(executed_block_id++, block, arguments);
      });
    }
  };

  // override load start method to wait for testcase being available
  var _oldLoadStart = Runtime.prototype.loadStart;
  Runtime.prototype.loadStart = function () {
    _oldLoadStart.apply(runtime, []);
    if (!runtime.projectLoaded) {
      console.log("loadStart finished, but project not loaded");
      return;
    }

    if (!runner.isTestcaseSpecAvailable()) {
      runner.run_load_start_yourself = true;
      return;
    } else {
      runner.run_load_start_yourself = false;
      runner.start();
    }
  };
});