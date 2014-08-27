console.log('Loading a web page');
var page = require('webpage').create();
var url = 'load.html';
page.open(url, function (status) {
  var title = page.evaluate(function () {
    return document.querySelector('h1').innerHTML;
  });

  //console.log("h1 = " + title);
  setTimeout(function () { phantom.exit(); }, 2000);
});
