var normalizeSpriteName = function (v) {
  return ("" + v).trim();
}

var normalizeCostumeName = function (v) {
  return ("" + v).trim();
}

var TestFrameworkRunner = function () {
  var project_json;
  var project_id;
  var blockseq;
  var testcase_spec = null;
  var costume_file_map;
  var last_error_msg = '';
  var msg = new MessageBus();

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
          msg.send({'type': 'action', 'action': ['mousemove', input[1], input[2]]});
          break;
        case 'userPointToSprite':
          var sprite = input[1];
          var costume = getVisibleCostume(sprite);
          var pos = getCostumePosition(costume, sprite);
          msg.send({'type': 'action', 'action': ['mousemove', pos[0], pos[1]]});
          break;
        case 'userClick':
          msg.send({'type': 'action', 'action': ['click']});
          break;
        case 'userPress':
          if(input[1] === 'mousebutton')
            msg.send({'type': 'action', 'action': ['mousedown']});
          else
            msg.send({'type': 'action', 'action': ['keydown', input[1]]});
          break;
        case 'userRelease':
          if (input[1] === 'mousebutton')
            msg.send({'type': 'action', 'action': ['mouseup']});
          else
            msg.send({'type': 'action', 'action': ['keyup', input[1]]});
          break;
        case 'userType':
          for (var l = 0; l < input[1].length; l++)
            msg.send({'type': 'action', 'action': ['keypress', input[1][l]]});
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

  var checkArguments = function(whenlist, args) {
    for (i = 1; i < whenlist[0].length; i++) {
      if (whenlist[0][i] != normalizeCostumeName(args.args[i - 1])) {
        console.warn("Wrong Arguments: expected: -" + whenlist[0][i] +
                     "- seen: -" + args.args[i - 1] + "-");
        return false;
      }
    }
    return true;
  };


  var blockExecuted = function (block_counter, blockname, args) {

    // internal blocks (like timerReset) do not have a target
    if (typeof interp.activeThread.target === 'undefined') {
      return;
    }

    var target = interp.activeThread.target.objName;

    if (blockseq[target] !== undefined
            && blockseq[target].length
            && blockseq[target][0][0] === blockname
            && checkArguments(blockseq[target], args))
    {

      blockseq[target].shift();

      // if user interaction block
      //   remove user interaction block
      //   send message to process outside phantomjs
      while (blockseq[target].length
              && blockseq[target][0].length
              && blockseq[target][0][0].substr(0, 4) === "user")
      {
        var input = blockseq[target].shift();
        executeUserInteraction(input);
      }

      var suffix = (args === undefined ? "" : "  arguments: " + args.args);
      console.info("[executed, matches queue] blockname = " + blockname + suffix);

      for (var sprite in blockseq) {
        if (blockseq[sprite].length > 0) {
          console.log("Queue still contains blocks " + JSON.stringify(blockseq) + " with current sprite " + sprite);
          return;
        }
      }

      checkThen();
      return;
    }

    // else - not interested in block
    if (blockname != "wait:elapsed:from:") {  // especially annoying block ;)
      var suffix = (args === undefined ? "" : "  arguments: " + args.args);
      console.info("[executed, does NOT match queue] blockname = " + blockname + suffix);
      console.log("Queue still contains blocks " + JSON.stringify(blockseq));
    }

  };

  var isTestcaseSpecAvailable = function () {
    return (testcase_spec !== null);
  };

  var setTestcaseSpec = function (spec) {
    if (!spec) {
      console.warn("setTestcaseSpec: spec is unexpectedly empty");
      return;
    }
    if (testcase_spec)
      console.warn("setTestcaseSpec: spec already set. Overwriting now");

    console.info("Browser received testcase specification");
    testcase_spec = spec;
  };

  var takeScreenshot = function (suffix) {
    msg.send({'type': 'action', 'action': ['screenshot', suffix]});
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

  var started = false;
  var count_retries = 0;
  var wait_for_start = function () {

    var retry = function () {
      // provide a screenshot for debugging
      if (count_retries++ === 20) {
        var filename_suffix = 'debug-{1}-timeout-at-{2}ms'
          .replace('{1}', (testcase_spec && testcase_spec.id) || 'unknown')
          .replace('{2}', count_retries * 100);
        takeScreenshot(filename_suffix);
      }

      console.info("Retrying in 100ms");
      setTimeout(function () { runner.wait_for_start(); }, 100);
      return false;
    };


    if (started)
      return true;

    if (typeof runtime === 'undefined' || !runtime.projectLoaded) {
      console.warn("1st condition of 2 NOT met, runtime.projectLoaded = false");
      return retry();
    } else {
      console.info("1st condition of 2 met: Project was loaded in player");
    }

    if (!this.isTestcaseSpecAvailable()) {
      console.warn("2nd condition of 2 NOT met, testcase specification not available");
      return retry();
    } else {
      console.info("2nd condition of 2 met: Testcases specification is available");
    }

    started = true;
    start();
    return true;
  };


  var start = function () {
    // test sane initialization
    if (typeof io === 'undefined')
      throw new Error("Could not initialize Scratch-HTML5 player properly");

    // retrieve project ID
    project_json = io.data;
    project_id = testcase_spec['id'];

    console.info("Running testsuite and project #" + project_id + " in browser in 500ms");

    blockseq = testcase_spec['when'];

    console.debug("The following blocks mentioned in When statements are in the queue: " + JSON.stringify(blockseq));

    // retrieve data from project.json
    analyzeProjectJSON();

    // trigger "whenGreenFlag"
    setTimeout(function () {
      console.info("Running project NOW");
      $("#overlay").click();
    }, 500);
  };

  var getSprite = function (sprite) {
    var sprite_obj = costume_file_map[normalizeSpriteName(sprite)];
    if (sprite_obj === undefined)
      throw new Error("Sprite " + sprite + " does not exist!");
    return sprite_obj;
  };

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
    if (found.is(":visible"))
      msg.send({'type': 'test', 'test': {
        'what': "costume " + costume + " of " + sprite,
        'expected': "is visible",
        'actual': "was visible",
        'state': 'ok'
      }});
    else
      msg.send({'type': 'test', 'test': {
        'what': "costume " + costume + " of " + sprite,
        'expected': "is visible",
        'actual': "not visible",
        'state': 'failure'
      }});
  };

  var checkHidden = function (costume, sprite) {
    found = getCostume(costume, sprite);
    if (found.is(":visible"))
      throw new Error("Expected costume " + costume + " of " + sprite + " to be hidden, but is not");
  };

  var checkSpriteVisible = function (sprite, visible) {
    var sprite_obj = getSprite(sprite);
    for (var costume in sprite_obj) {
      var filename = sprite_obj[normalizeCostumeName(costume)];
      var found = getCostumeByFilename(filename);
      if (found.is(":visible")) {
        if (!visible)
          throw new Error("Expected sprite " + sprite + " to be hidden, " +
          "but costume " + costume + " is visible");
        return;
      }
    }
    if (visible)
      throw new Error("Expected sprite " + sprite + " to be visible, but is not");
  }

  var checkPosition = function (costume, sprite, x, y) {
    console.info("checkPosition: check for x:" + x + " and y:" + y);

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
    for (var costume in sprite_obj) {
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

    if (size !== scale * 100) {
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
    if (rot !== parseInt(rotation.replace("deg",""))) {
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

    if (curr_height !== height || curr_height !== height) {
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
    if (curr_value == undefined) {
      throw new Error("Variable " + variable + " not found in global scope!");
    }
    if (curr_value != value) {
      throw new Error("Expected value " + value + " for variable " +
                      variable + " current value: " + curr_value);
    }
  };

  var checkThen = function () {
    console.info("We are done with executing blocks.");
    console.info("Checking state of elements in player according to Then statements.");

    var err_msg;
    var success = true;
    try {
      for (var i in testcase_spec['then']) {
        console.info("Checking '" + testcase_spec['then'][i][0] + "'");
        switch (testcase_spec['then'][i][0]) {
          case 'visible':
            checkVisible(testcase_spec['then'][i][1], testcase_spec['then'][i][2]);
            break;
          case 'sprite_visible':
            checkSpriteVisible(testcase_spec['then'][i][1], true);
            break;
          case 'sprite_hidden':
            checkSpriteVisible(testcase_spec['then'][i][1], false);
            break;
          case 'hidden':
            checkHidden(testcase_spec['then'][i][1], testcase_spec['then'][i][2]);
            break;
          case 'position':
            checkPosition(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                          testcase_spec['then'][i][3], testcase_spec['then'][i][4]);
            break;
          case 'size_percentage':
            checkSizePercent(testcase_spec['then'][i][1], testcase_spec['then'][i][2],
                             testcase_spec['then'][i][3]);
            break;
          case 'size':
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
      }
    } catch (e) {
      success = false;
      err_msg = e.message + "\n\n" + e.stack;
    }

    msg.send({'type': 'report',
      'report': {
        'ok' : success,
        'errors' : [err_msg]
      }
    });
  };

  return {
    wait_for_start : wait_for_start,
    blockExecuted : blockExecuted,
    isTestcaseSpecAvailable : isTestcaseSpecAvailable,
    setTestcaseSpec : setTestcaseSpec,
    lastErrorMessage : function () { return last_error_msg; }
  };
}
