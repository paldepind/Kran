var linkedList = require('./linkedlist')

// Component
var component = []

component.new = function(constr) {
  constr.belongsTo = []
  this.push(constr)
  return this.length - 1
}

// System
var system = []

system.new = function(props) {
  var id = this.length
  props.entities = new linkedList()

  if (props.group) {
    if (!this[props.group]) {
      this[props.group] = []
      this[props.group].run = runGroup
    }
    this[props.group].push(id)
  }
  if (props.components !== undefined) {
    if (!(props.components instanceof Array)) {
      props.components = [ props.components ]
    }
    props.components.forEach(function (compId) {
      component[compId].belongsTo.push(id)
    })
  }
  this.push(props)
  return id
}

var runGroup = function() {
  for (var i = 0; i < this.length; i++) {
    system.run(this[i])
  }
}

system.run = function(sysId) {
  var sys = this[sysId],
      entity,
      components

  callIfExists(sys.pre)

  if ((entity = sys.entities.head) != null &&
      sys.components) {
    do {
      var entityId = entity.data
      components = [] // FIXME
      sys.components.forEach(function (compId) {
        components.push(entity[entityId.data][compId])
      })
      sys.every.apply(sys, components)
    } while ((entity = entityId.next) != null)
  }
  
  callIfExists(sys.post)
}

system.runAll = function() {
  for (var i = 0; i < this.length; i++) {
    system.run(i)
  }
}

// Entity

var entity = []

entity.new = function () {
  var id = this.length
  this.push(new Array(component.length))
  this[id].add = addComponent
  this[id].qualifiesFor = qualifiesForSystem
  return id
}

var addComponent = function(compId) {
  that = this
  this[compId] = component[compId]()
  component[compId].belongsTo.forEach(function (sysId) {
    system[sysId].entities.add(sysId)
    if (that.qualifiesFor(sysId)) {
      system[sysId].entities.add(sysId)
    }
  })
}

var qualifiesForSystem = function (sysId) {
  system[sysId].components.forEach(function (compId) {
    if (!this[compId]) {
      return false
    }
  })
  return true
}

// Helper functions

var callIfExists = function(func) {
  if (typeof func == 'function') {
    func()
  }
}

// Export
exports.component = component
exports.system = system
exports.entity = entity
