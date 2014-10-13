var TestFrameworkRunner = function (tc) {
  var project_json;

  var start = function () {
	var id = tc['id'];
	
	if (typeof io === 'undefined')
	  throw new Error("Could not initialize Scratch-HTML5 player properly");

	var old = runtime.loadStart;
	runtime.loadStart = function () {
      old.apply(runtime, []);

	  console.log("Found " + tc['when'].length + " when clauses");
	  
	  // intercept
	  for (var w in tc['when']) {
		var blockname = tc['when'][w][0];
		var old_function = interp.primitiveTable[blockname];
		console.log("was ", old_function);
		console.log("Intercepting " + blockname);
		interp.primitiveTable[blockname] = function (b) {
		  console.log("Event " + blockname + " triggered");
		  old_function.apply(interp.primitiveTable, [b]);
		}
	  }

	  parseWhen();
	};
	
	project_json = io.data;
  };

  var parseWhen = function () {
	var old = interp.stepThreads;
	interp.stepThreads = function (a, b, c) {
	  console.log("interp.stepThreads");
	  old.apply(interp, [a, b, c]);
	};

	$(document).ready(function () {
	  $("#overlay").click();
	});
  };
  
  var checkVisible = function () {
  };
  
  var checkThen = function () {
  };
  
  return { start : start };
}

function startTestFramework(testcase) {
  var runner = new TestFrameworkRunner(testcase);
  runner.start();
}
