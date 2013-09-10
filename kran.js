(function () {

  var Kran = {}

  // ***********************************************
  // Component
  //
  var component = Kran.component = []

  component.new = function(comp) {
    comp.belongsTo = []
    this.push(comp)
    return this.length - 1
  }

  // ***********************************************
  // System
  //
  var system = Kran.system = []

  system.new = function(props) {
    var id = this.length
    props.entities = new LinkedList()
    props.run = runSystem

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
      props.compsBuffer = new Array(props.components.length)
    }
    this.push(props)
    return id
  }

  var runSystem = function() {
    callIfExists(this.pre) // Call pre

    this.entities.forEach(function (entId) { // Call every
      callFuncWithCompsFromEnt(this.components, this.compsBuffer,
                               entity[entId], this.every)
    }, this)
    
    callIfExists(this.post) // Call post
  }

  var callFuncWithCompsFromEnt = function(comps, buffer, ent, func) {
    for (var i = 0; i < comps.length; i++) {
      buffer[i] = ent[comps[i]]
    }
    func.apply(ent, buffer)
  }

  var runGroup = function() {
    for (var i = 0; i < this.length; i++)
      system[this[i]].run()
  }

  system.runAll = function() {
    this.forEach(function(sys) { sys.run() })
  }

  // ***********************************************
  // Entity
  //
  var entity = Kran.entity = []

  entity.new = function () {
    var id = this.length
    this.push(new Array(component.length))
    this[id].id = id
    this[id].add = addComponent
    this[id].remove = removeComponent
    this[id].belongsTo = new LinkedList
    return this[id]
  }

  var addComponent = function(compId, arg1, arg2, arg3, arg4, arg5, arg6) {
    var sysEntry, sys

    if (this[compId !== undefined]) throw "The entity already has the component"
    if (typeof(component[compId]) === 'function') {
      this[compId] = new component[compId](arg1, arg2, arg3, arg4, arg5, arg6)
    } else {
      this[compId] = component[compId]
    }
    component[compId].belongsTo.forEach(function (sysId) {
      if (qualifiesForSystem(this, sysId)) {
        sys = system[sysId]
        sysEntry = sys.entities.add(sysId)
        this.belongsTo.add(sysEntry)
        if (sys.arrival) {
          callFuncWithCompsFromEnt(sys.components,
            sys.compsBuffer, this, sys.arrival)
        }
      }
    }, this)
    return this
  }

  var removeComponent = function(compId) {
    var sys
      
    var tempComp = this[compId]
    this.belongsTo.forEach(function (sysEntry, elm) {
      this[compId] = undefined
      if (!qualifiesForSystem(this, sysEntry.data)) {
        this[compId] = tempComp
        sys = system[sysEntry.data]
        sysEntry.remove()
        elm.remove()
        if (sys.departure) {
          callFuncWithCompsFromEnt(sys.components,
            sys.compsBuffer, this, sys.departure)
        }
      }
    }, this)
    this[compId] = undefined
  }

  var qualifiesForSystem = function (entity, sysId) {
    return system[sysId].components.every(function (compId) {
      if (entity[compId] === undefined) {
        return false
      }
      return true
    })
  }

  // ***********************************************
  // Helper functions
  //
  var callIfExists = function(func) {
    if (typeof func == "function") {
      func()
    }
  }

  // ***********************************************
  // Linked list
  //
  var LinkedList = Kran.LinkedList = function () {
    this.head = null
    this.tail = null
  }

  function Element(data, list) {
    this.data = data
    this.list = list 
    this.prev = list.tail
    this.next = null
  }

  Element.prototype.remove = function() {
    if (this.prev) {
      this.prev.next = this.next
    } else {
      this.list.head = this.next
    }
    if (this.next) {
      this.next.prev = this.prev
    } else {
      this.list.tail = this.prev
    }
  }

  LinkedList.prototype.add = function(data) {
    var elm = new Element(data, this)
    if (this.tail) {
      this.tail.next = elm
    } else {
      this.head = elm
    }
    this.tail = elm
    return elm
  }

  LinkedList.prototype.forEach = function(func, context) {
    var elm, nextElm = this.head
    
    while (nextElm != null) {
      elm = nextElm
      nextElm = elm.next
      func.call(context, elm.data, elm)
    }
  }

  // ***********************************************
  // Export
  //
  if (typeof module === "object" && // CommonJS
      typeof module.exports === "object") {
    module.exports = Kran
  } else if (typeof define === "function" && define.amd) { // AMD module
    define("kran", [], function() { return Kran } )
  } else { // Otherwise just attach to the global object
    this.Kran = Kran
  }

}).call(this)
