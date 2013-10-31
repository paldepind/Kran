(function () {

  var Kran = function() {
    this.components = []

    this.systems = []
    this.systemGroups = {}
    this.systemGroups.all = new SystemGroup()

    this.entityCollections = {}
  }

  // ***********************************************
  // Component
  //
  function Component(comp) {
    if (isFunc(comp) || typeof(comp) === "string") {
      this.value = comp
    } else if (comp === true || comp === undefined) {
      this.value = true
    } else {
      throw new TypeError("Argument " + comp + " is given but not a function or string")
    }
    this.collectionsRequieringComp = []
  }

  Kran.prototype.component = function(comp) {
    this.components.push(new Component(comp))
    return this.components.length - 1
  }

  function checkComponentExistence(comps, compId) {
    if (comps[compId] !== undefined) {
      return compId
    } else {
      throw new Error("Component " + compId + " does no exist")
    }
  }

  // ***********************************************
  // Entity collections
  //
  var EntityCollection = function(comps) {
    this.comps = comps
    this.buffer = new Array(comps.length + 2)
    this.ents = new LinkedList()
    this.arrival = []
  }

  EntityCollection.prototype.callWithComps = function(ent, func, context, ev) {
    var offset = 0
    if (ev) this.buffer[offset++] = ev
    for (var i = 0; i < this.comps.length; i++) {
      // Boolean components are equal to their id
      if (ent.comps[this.comps[i]] !== this.comps[i]) {
        this.buffer[offset++] = ent.comps[this.comps[i]]
      }
    }
    this.buffer[offset] = ent
    func.apply(context, this.buffer)
  }

  EntityCollection.prototype.forEachWithComps = function(every, context, ev) {
    this.ents.forEach(function (ent) { // Call every
      this.callWithComps(ent, every, context, ev)
    }, this)
  }

  Kran.prototype.getEntityCollection = function(comps) {
    comps = wrapInArray(comps)
    var key = comps.slice(0).sort().toString()
    if (this.entityCollections[key] === undefined) {
      var newCol = this.entityCollections[key] = new EntityCollection(comps)

      // Mark components that are part of this collection
      comps.forEach(function (compId) {
        compId = getCompId(compId)
        checkComponentExistence(this.components, compId)
        this.components[compId].collectionsRequieringComp.push(newCol)
      }, this)
    }
    return this.entityCollections[key] 
  }

  // ***********************************************
  // System
  //
  var SystemGroup = function () {
    this.members = []
  }

  SystemGroup.prototype.run = function() {
    this.members.forEach(function (member) {
      member.run()
    })
  }

  Kran.prototype.system = function(props) {
    var id = this.systems.length
    props.run = runSystem

    if (props.components !== undefined) {
      props.collection = this.getEntityCollection(props.components)
      if (isFunc(props.arrival)) props.collection.arrival.push(props.arrival)
    }
    if (props.on) {
      props.on = wrapInArray(props.on)
      props.on.forEach(function (event) {
        window.addEventListener(event, props.run.bind(props))
      })
    } else {
      // Only systems not listening for events are put in the all group
      this.systemGroups.all.members.push(props)
    }
    if (props.group) {
      if (this.systemGroups[props.group] === undefined) {
        this.systemGroups[props.group] = new SystemGroup(props.group)
      }
      this.systemGroups[props.group].members.push(props)
    }
    this.systems.push(props)
  }

  Kran.prototype.run = function(group) {
    this.systemGroups[group].members.forEach(function (member) {
      member.run()
    })
  }

  var runSystem = function(ev) {
    if (this.collection !== undefined &&
        this.collection.ents.length === 0) {
      return
    }
    if (ev && ev instanceof CustomEvent) {
      ev = ev.detail
    }
    if (isFunc(this.pre)) this.pre(ev)
    if (isFunc(this.every)) {
      this.collection.forEachWithComps(this.every, this, ev)
    }
    if (isFunc(this.post)) this.post(ev)
  }

  // ***********************************************
  // Entity
  //
  var Entity = function(compBlueprints) {
    this.comps = new Array(compBlueprints.length)
    this.compBlueprints = compBlueprints
    this.belongsTo = new LinkedList()
  }

  Entity.prototype.add = function(compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    compId = getCompId(compId)
    checkComponentExistence(this.compBlueprints, compId)
    if (this.comps[compId] !== undefined) throw new Error("The entity already has the component")
    var comp = this.compBlueprints[compId].value
    if (isFunc(comp)) {
      this.comps[compId] = new comp(arg1, arg2, arg3, arg4, arg5, arg6, arg7)
      this.comps[compId].id = compId
    } else if (typeof comp === "string") {
      var obj = { id: compId }
      obj[comp] = arg1
      this.comps[compId] = obj
    } else {
      this.comps[compId] = compId
    }
    this.compBlueprints[compId].collectionsRequieringComp.forEach(function (coll) {
      if (qualifiesForCollection(this, coll.comps)) {
        addEntityToCollection(this, coll)
      }
    }, this)
    return this
  }

  Entity.prototype.get = function(compId) {
    return this.comps[getCompId(compId)]
  }

  Entity.prototype.has = function(compId) {
    return this.comps[getCompId(compId)] !== undefined
  }

  Entity.prototype.remove = function(compId) {
    compId = getCompId(compId)
    if (this.comps[compId] === undefined) throw new Error("The entity doesn't have the component")
    this.comps[compId] = undefined
    this.belongsTo.forEach(function (collBelonging, elm) {
      if (!qualifiesForCollection(this, collBelonging.comps)) {
        collBelonging.entry.remove()
        elm.remove()
      }
    }, this)
    return this
  }

  Entity.prototype.trigger = function (compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    compId = getCompId(compId)
    this.add(compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7)
    this.remove(compId)
  }

  Entity.prototype.delete = function() {
    this.belongsTo.forEach(function (collBelonging, elm) {
      collBelonging.entry.remove()
    })
  }

  Kran.prototype.entity = function () {
    return new Entity(this.components)
  }

  var CollectionBelonging = function (comps, entry) {
    this.comps = comps
    this.entry = entry
  }

  var addEntityToCollection = function(ent, coll) {
    coll.arrival.forEach(function (func) {
      coll.callWithComps(ent, func)
    })
    var collEntry = coll.ents.add(ent)
    ent.belongsTo.add(new CollectionBelonging(coll.comps, collEntry))
  }

  function getCompId(compId) {
    if (typeof compId === "number") { 
      return compId
    } else if (typeof compId === "object" && typeof compId.id === "number") {
      return compId.id
    }
    throw new TypeError(compId + " is not a component id or an oject containing an id")
  }

  var qualifiesForCollection = function (ent, comps) {
    return comps.every(function (compId) {
      if (ent.comps[compId] === undefined) {
        return false
      }
      return true
    })
  }

  // ***********************************************
  // Event system
  //
  Kran.prototype.trigger = function(name, data) {
    var event = new CustomEvent(name, { detail: data })
    window.dispatchEvent(event)
  }

  // ***********************************************
  // Helper functions
  //
  var isFunc = function(func) {
    if (typeof func === 'function') {
      return true
    } else {
      return false
    }
  }

  var wrapInArray = function(arg) {
    if (arg instanceof Array) {
      return arg
    } else {
      return [arg]
    }
  }

  // ***********************************************
  // Linked list
  //
  var LinkedList = Kran.LinkedList = function () {
    this.head = null
    this.tail = null
    this.length = 0
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
    this.list.length--
  }

  LinkedList.prototype.add = function(data) {
    var elm = new Element(data, this)
    if (this.tail) {
      this.tail.next = elm
    } else {
      this.head = elm
    }
    this.tail = elm
    this.length++
    return elm
  }

  LinkedList.prototype.forEach = function(func, context) {
    var elm, nextElm = this.head
    
    while (nextElm !== null) {
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
