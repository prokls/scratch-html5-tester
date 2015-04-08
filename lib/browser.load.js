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
  if (!win)
    console.error("win in contentLoaded undefined");
  if (!fn)
    console.error("fn in contentLoaded undefined");
  if (!win || !fn)
    return;

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
      rewrite(name, this.primitiveTable, function (block, args) {
        runner.blockExecuted(executed_block_id++, block, args);
      });
    }
  };
});
