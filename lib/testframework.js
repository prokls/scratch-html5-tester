var TestFrameworkRunner = function (tc) {
  var project_json;
  var blockseq;

  var start = function () {
    var id = tc['id'];

    if (typeof io === 'undefined')
      throw new Error("Could not initialize Scratch-HTML5 player properly");

    var old = runtime.loadStart;
    runtime.loadStart = function () {
      old.apply(runtime, []);
      if (!runtime.projectLoaded)
        return;

      console.debug("Running loadStart");

      // retrieve sequence of expected blocks
      blockseq = [];
      for (var w in tc['when']) {
        blockseq.push(tc['when'][w][0]);
      }

      console.debug("I am expecting the following blocks for When statements: " + JSON.stringify(blockseq));

      // retrieve project ID
      project_json = io.data;

      // run project
      setTimeout(function () { $("#overlay").click() }, 500);
    };

    // TODO: does not work. much too late due to assignment to primFcn in Interpreter.
    //   Approach with Interpreter.prototype.stepActiveThread?
    var old2 = interp.lookupPrim;
    interp.lookupPrim = function (op) {
      console.log("lookupPrim", JSON.stringify(op));
      old2.apply(interp, op);
      // intercept
      /*for (var w in tc['when']) {
        var blockname = tc['when'][w][0];
        var old_function = interp.primitiveTable[blockname];
        if (!old_function.intercepted) {
          interp.primitiveTable[blockname] = function (b) {
            if (blockseq[0] === blockname) {
              console.log("Reducing expected block sequence");
              blockseq = blockseq.slice(1);
            }
            old_function.apply(interp.primitiveTable, [b]);
            if (blockseq.length === 0)
              checkThen();
          }
          interp.primitiveTable[blockname].intercepted = true;
        }
      }*/

    };
  }

  var checkVisible = function () {
  };
  
  var checkThen = function () {
    window.testsuite_running = true;
  };
  
  return { start : start };
}

function startTestFramework(testcase) {
  window.testsuite_finished = false;
  var runner = new TestFrameworkRunner(testcase);
  runner.start();
}
