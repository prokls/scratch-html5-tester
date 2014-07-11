module.exports = function(bottles) {
  this.bottles = bottles;
  this.fall = function(n) {
    this.bottles -= n;
  }
};
