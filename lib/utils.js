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

var Logger = function (component) {
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

/**
 * A set implementation. A set is considered to be an array
 * containing every element at most once. Elements are considered
 * equal iff the triple-equality operator returns true.
 * Elements are always sorted.
 *
 * @constructor
 * @param {array} initial - Initial set of values
 * @returns {object} A new Set instance
 * @example
 * var s = new Set([1, 1, 2]);
 * s.add(3);
 * s.add(3);
 * console.log(s.toArray());
 * // [1, 2, 3]
 */
var Set = function (initial) {
  var set = [];

  var eq = function (a, b) {
    return a === b;
  };

  var lt = function (a, b) {
    return a < b;
  };

  var find = function (val) {
    var low = 0;
    var high = set.length - 1;

    if (lt(val, set[low]) || high < low)
      return 0;
    if (lt(set[high], val))
      return set.length;

    while (high - low > 1) {
      var half = low + Math.floor((high - low) / 2);
      if (lt(set[half], val))
        low = half;
      else
        high = half;
    }

    if (eq(set[low], val))
      return low;
    return high;
  };

  /**
   * Add an element to the data structure.
   * If element already exists, nothing is changed.
   * You can screw up the data structure by mixing various types.
   *
   * @param {any} value - the value to add
   * @returns {Set} 'this' to support method chaining
   */
  var add = function (value) {
    var index = find(value);
    if (eq(set[index], value))
      return this;  // duplicate
    set.splice(index, 0, value);
    return this;
  };

  /**
   * Add several elements to the data structure.
   * If some element already exists, this element will be skipped.
   * You can screw up the data structure by mixing various types.
   *
   * @param {any} value - the value to add
   * @returns {Set} 'this' to support method chaining
   */
  var extend = function (values) {
    for (var k in values)
      add(values[k]);
    return this;
  };

  /**
   * Does the given value exist in the data structure?
   *
   * @param {any} value - the value to search for
   * @returns {boolean} existence
   */
  var contains = function (value) {
    var index = find(value);
    return !!(eq(set[index], value));
  };

  /**
   * Represent data structure as string.
   *
   * @returns {string} string representation
   */
  var toString = function () {
    return "[" + set.join(", ") + "]";
  };

  /**
   * Represent data structure as array.
   *
   * @returns {Array} sorted Array instance containing all unique values
   */
  var toArray = function () {
    return set;
  };

  extend(initial);

  return {
    add: add, extend: extend, contains: contains,
    toString: toString, toArray: toArray
  };
};

var countObjectAttributes = function (obj) {
  var counter = 0;

  for (var _ in obj)
    counter += 1;

  return counter;
};


var randomAttribute = function (obj) {
  var one_iter = false;
  var err = "Cannot select random attributes in empty object";
  while (true) {
    for (var member in obj) {
      if (Math.random() > 0.8)
        return member;
      one_iter = true;
    }
    if (!one_iter)
      throw new Error(err);
  }
};




exports.Logger = Logger;
exports.Set = Set;
exports.countObjectAttributes = countObjectAttributes;
exports.randomAttribute = randomAttribute;
