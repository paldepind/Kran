var linkedList = require('./linkedlist')

// Component
var component = []

component.add = function(constr) {
  this.push(constr);
  return this.length - 1;
}

// System
var system = []

system.add = function(props) {
  var id = this.length
  props.entities = new linkedList();

  if (props.group) {
    if (!this[props.group]) {
      this[props.group] = []
      this[props.group].run = function() {
        for (var i = 0; i < this.length; i++) {
          system.run(this[i])
        }
      }
    }
    this[props.group].push(id)
  }

  this.push(props)
  return id
}

system.run = function(sysId) {
  var sys = this[sysId],
      entity,
      components

  callIfExists(sys.pre)

  if ((entityId = sys.entities.head) != null &&
      sys.components) {
    do {
      components = [] // FIXME
      sys.components.forEach(function (compId) {
        components.push(entity[entityId.data][compId])
      })
      sys.every.apply(sys, components)
    } while ((entityId = entityId.next) != null)
  }
  
  callIfExists(sys.post)
}

system.runAll = function() {
  for (var i = 0; i < this.length; i++) {
    system.run(i)
  }
}

// Helper functions
var callIfExists = function(func) {
  if (typeof func == 'function') {
    func()
  }
}

exports.component = component
exports.system = system
