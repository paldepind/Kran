linkedList = require('./linkedlist')

component = []

component.add = function(constr) {
  this.push(constr);
  return this.length - 1;
}

exports.component = component
