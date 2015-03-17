/**
 * A logger instance for simplified logging of actions.
 * @constructor
 * @param {string} component - Component which uses this Logger instance
 * @returns {object} A new Logger instance
 * @example
 * var l = Logger('main');
 * l
 *  .log(5, 7)
 *  .dump('message', {'msg': 'Some debug info', 'level': 'DEBUG'})
 *  .dump('data', '?')
 *  .stack();
 */
exports.Logger = function (component) {
  /**
   * Return concatenated string representation of arbitrary arguments
   * @param {args} array - Arbitrary arguments having string representations
   * @returns {string} String representation of args
   */
  var _build_msg = function (args) {
    var str = '';
    for (var arg in args)
      str += "" + args[arg] + " ";
    return str;
  };

  /**
   * Dump an arbitrary, unknown value
   * @param {any} obj - an arbitrary, unknown value
   * @returns {string} String representation of the parameter
   *                   including value and type info
   */
  var _dump_unknown = function (obj) {
    var str = "" + (typeof obj);
    if (str !== 'object')
      str += ' ' + obj;
    else {
      str += "{\n";
      for (var prop in obj) 
        str += "  " + prop + " :: " + obj[prop] + "\n";
      str += "}";
    }
    return str;
  };


  return {
    'log': function () {
      console.log("[" + component + "] " + _build_msg(arguments));
      return this;
    },
    'warn': function () {
      console.log("[" + component + "] WARN! " + _build_msg(arguments));
      return this;
    },
    'dump': function (name, val) {
      console.log("[" + component + "." + name + "] " + _dump_unknown(val));
      return this;
    },
    'stack': function () {
      console.trace();
      return this;
    }
  };
};
