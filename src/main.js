var LinkedList = require('./linkedlist')

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
  props.entities = new LinkedList()

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
      ent,
      components

  callIfExists(sys.pre)

  if (sys.components) {
    sys.entities.forEach(function (entityId) {
      components = [] // FIXME
      sys.components.forEach(function (compId) {
        components.push(entity[entityId][compId])
      })
      sys.every.apply(sys, components)
    })
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
  this[id].id = id
  this[id].add = addComponent
  this[id].remove = removeComponent
  this[id].belongsTo = new LinkedList
  return this[id]
}

var addComponent = function(compId) {
  this[compId] = new component[compId]()
  component[compId].belongsTo.forEach(function (sysId) {
    if (qualifiesForSystem(this, sysId)) {
      var sysEntry = system[sysId].entities.add(sysId)
      this.belongsTo.add(sysEntry)
    }
  }, this)
  return this
}

var removeComponent = function(compId) {
  this[compId] = undefined
  this.belongsTo.forEach(function (sysEntry, elm) {
    if (!qualifiesForSystem(this, sysEntry.data)) {
      sysEntry.remove()
      elm.remove()
    }
  }, this)
}

var qualifiesForSystem = function (entity, sysId) {
  return system[sysId].components.every(function (compId) {
    if (entity[compId] === undefined) {
      return false
    }
    return true
  })
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
