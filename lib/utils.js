"use strict";

/**
 * A logger instance for simplified logging of actions.
 * @constructor
 * @param {string} component - Component which uses this Logger instance
 * @returns {object} A new Logger instance
 * @example
 * var log = Logger('main');
 * log
 *  .info(5, 7)
 *  .dump('message', {'msg': 'Some debug info', 'level': 'DEBUG'})
 *  .dump('data', '?')
 *  .stack();
 */
if (typeof exports === 'undefined') {
  var exports = {};
  this.utils = exports;
}

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
    /** Log a message with level SEVERE */
    'error': function () {
      console.error("[" + component + "] " + _build_msg(arguments).red);
      return this;
    },

    /** Log a message with level WARN */
    'warn': function () {
      console.warn("[" + component + "] WARN! " + _build_msg(arguments).yellow);
      return this;
    },

    /** Log a message with level INFO */
    'info': function () {
      console.info("[" + component + "] INFO: " + _build_msg(arguments));
      return this;
    },

    /** Dump a variable of unknown type */
    'dump': function (val, name) {
      var prefix;
      if (name)
        prefix = "." + name;
      else
        prefix ="";

      console.log("[" + component + prefix + "] " + _dump_unknown(val));
      return this;
    },

    /** Provide a stack trace in the log output */
    'stack': function () {
      console.trace();
      return this;
    }
  };
};
