"use strict";

var MessageBus = function () {
  var listeners = [];

  var send = function (obj) {
    if (typeof window.callPhantom === 'function')
      window.callPhantom(obj);
    else
      throw new Error("PhantomJS onCallback not available");
  };

  var listen = function (clbk) {
    listeners.push(clbk);
  };

  var receive = function (msg) {
    for (var i = 0; i < listeners.length; i++)
      listeners[i](msg);
  };

  return { send : send, listen : listen, receive : receive };
};
