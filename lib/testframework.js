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
  var run_load_start_yourself = false;
  var finished = false;
  var costume_file_map;
  var succeeded = null;

  var blockExecuted = function (blockname, arguments) {
    if (blockseq[0] === blockname) {
      blockseq.shift();

      console.log("block of name " + blockname + " executed");
      console.log("---arguments: " + JSON.stringify(arguments) + "-" + arguments.type);
      console.log("Still expecting blocks " + JSON.stringify(blockseq));

      if (blockseq.length === 0) {
        console.log("Hey! Expected block sequence got empty. Starting Then checks");
        checkThen();
      }
    } else {
	  if(blockname != "wait:elapsed:from:") {
        console.log("Uninteresting block of name " + blockname + " executed");
        console.log("Still expecting blocks " + JSON.stringify(blockseq));
      }
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
      var sprite_name = normalizeSpriteName(entry.objName);
      costume_file_map[sprite_name] = {};
      entry.costumes.forEach(function (entry1) {
        var costume_name = normalizeCostumeName(entry1.costumeName);
        costume_file_map[sprite_name][costume_name] = entry1.baseLayerMD5;
      })
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

    // initialize sequence of expected blocks
    blockseq = [];
    for (var w in testcase_spec['when']) {
      blockseq.push(testcase_spec['when'][w][0]);
    }
    console.debug("I am expecting the following blocks for When statements: " + JSON.stringify(blockseq));

    // retrieve data from project.json
    analyzeProjectJSON();

    // trigger "whenGreenFlag"
    setTimeout(function () { $("#overlay").click() }, 500);
  };

  var checkVisible = function (costume, sprite) {
    var filename = costume_file_map[normalizeSpriteName(sprite)][normalizeCostumeName(costume)];
    var found = null;
    $("img").each(function () {
      if ($(this).attr("src").indexOf(filename) !== -1)
        found = $(this);
    });

    if (!found)
      throw new Error("Expected costume " + costume + " of " + sprite
        + " to be visible, but does not even exist");

    if (!found.is(":visible"))
      throw new Error("Expected costume " + costume + " of " + sprite + " to be visible, but is not");
  };

  var checkThen = function () {
    try {
      for (var i in testcase_spec['then']) {
        switch (testcase_spec['then'][i][0]) {
          case 'visible':
            checkVisible(testcase_spec['then'][i][1], testcase_spec['then'][i][2]);
            break;
        }
      }
      succeeded = true;
    } catch (e) {
      succeeded = false;
    }

    finished = true;
  };

  var hasFinished = function () {
    return finished;
  };

  var hasSucceeded = function () {
    return succeeded;
  };

  return {
    start : start,
    blockExecuted : blockExecuted,
    isTestcaseSpecAvailable : isTestcaseSpecAvailable,
    receiveTestcaseSpec : receiveTestcaseSpec,
    hasFinished : hasFinished,
    hasSucceeded : hasSucceeded
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

	var done = false, top = true,

	doc = win.document,
	root = doc.documentElement,
	modern = doc.addEventListener,

	add = modern ? 'addEventListener' : 'attachEvent',
	rem = modern ? 'removeEventListener' : 'detachEvent',
	pre = modern ? '' : 'on',

	init = function(e) {
		if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
		(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
		if (!done && (done = true)) fn.call(win, e.type || e);
	},

	poll = function() {
		try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
		init('poll');
	};

	if (doc.readyState == 'complete') fn.call(win, 'lazy');
	else {
		if (!modern && root.doScroll) {
			try { top = !win.frameElement; } catch(e) { }
			if (top) poll();
		}
		doc[add](pre + 'DOMContentLoaded', init, false);
		doc[add](pre + 'readystatechange', init, false);
		win[add](pre + 'load', init, false);
	}

}

function rewrite(name, primitiveTable, clbk) {
  var _old = primitiveTable[name];
  primitiveTable[name] = function (b) {
    _old.apply(primitiveTable, [b]);
    clbk(name, [b]);
  };
}

contentLoaded(window, function () {
  // initialize runner object
  window.runner = new TestFrameworkRunner();

  // override block operations with itself and call callback in runner object
  var _oldInitPrims = Interpreter.prototype.initPrims;
  Interpreter.prototype.initPrims = function () {
    _oldInitPrims.apply(this, arguments);

    for (var blockname in this.primitiveTable) {
      var name = blockname.toString();
      rewrite(name, this.primitiveTable, function (block, arguments) {
        runner.blockExecuted(block, arguments);
      });
    }
  };

  // override load start method to wait for testcase being available
  var _oldLoadStart = Runtime.prototype.loadStart;
  Runtime.prototype.loadStart = function () {
    _oldLoadStart.apply(runtime, []);
    if (!runtime.projectLoaded)
      return;

    if (!runner.isTestcaseSpecAvailable()) {
      runner.run_load_start_yourself = true;
      return;
    } else {
      runner.run_load_start_yourself = false;
      runner.start();
    }
  };
});
