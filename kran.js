(function () {

  var Kran = {}

  var reset = Kran.reset = function() {
    components.length = 0
    collectionsRequieringComp.length = 0
    entity.length = 0
    entityCollections = []
    systems.length = 0
    systems.all.length = 0
  }

  // ***********************************************
  // Component
  //
  var components = []
  var collectionsRequieringComp = []

  var component = Kran.component = function(comp) {
    if (typeof(comp) === "object") {
      var obj = {}
      for (prop in comp) {
        obj[prop] = createComponent(comp[prop])
      }
      return obj
    } else {
      return createComponent(comp)
    }
  }

  var createComponent = function(comp) {
    if (isFunc(comp) || typeof(comp) === "string") {
      components.push(comp)
    } else if (comp === true || comp === undefined) {
      components.push(true)
    } else {
      throw new TypeError("Argument " + comp + " is given but not a function")
    }
    collectionsRequieringComp.push([])
    return components.length - 1
  }

  var checkComponentExistence = function (compId) {
    if (components[compId] !== undefined) {
      return compId
    } else {
      throw new Error("Component " + compId + " does no exist")
    }
  }

  // ***********************************************
  // Entity collections
  //
  var entityCollections = {}

  var EntityCollection = function(comps) {
    this.comps = comps
    this.buffer = new Array(comps.length + 2)
    this.ents = new LinkedList()
    this.arrival = []

    // Mark components that are part of this collection
    comps.forEach(function (compId) {
      checkComponentExistence(compId)
      collectionsRequieringComp[compId].push(this)
    }, this)
  }

  EntityCollection.prototype.callWithComps = function(ent, func, context, ev) {
    if (ev) this.buffer[0] = ev
    for (var i = 0; i < this.comps.length; i++) {
      this.buffer[i + (ev ? 1 : 0)] = ent.comps[this.comps[i]]
    }
    this.buffer[i] = ent
    func.apply(context, this.buffer)
  }

  EntityCollection.prototype.forEachWithComps = function(every, context, ev) {
    this.ents.forEach(function (ent) { // Call every
      this.callWithComps(ent, every, context, ev)
    }, this)
  }

  var getEntityCollection = function(comps) {
    comps = wrapInArray(comps)
    var key = comps.slice(0).sort().toString()
    if (entityCollections[key]) {
      return entityCollections[key]
    } else {
      entityCollections[key] = new EntityCollection(comps)
      return entityCollections[key] 
    }
  }

  Kran.getEntities = function (comps) {
    return getEntityCollection(comps).ents
  }

  // ***********************************************
  // System
  //
  var systems = []
  var system = {}

  var runGroup = function() {
    for (var i = 0; i < this.length; i++) {
      systems[this[i]].run()
    }
  }

  var system = Kran.system = function(props) {
    var id = systems.length
    props.run = runSystem

    if (props.components !== undefined) {
      props.components = props.components
      props.coll = getEntityCollection(props.components)
      if (isFunc(props.arrival)) props.coll.arrival.push(props.arrival)
    }
    if (props.on) {
      props.on = wrapInArray(props.on)
      props.on.forEach(function (event) {
        window.addEventListener(event, props.run.bind(props))
      })
    } else {
      // Only systems not listening for events are put in the all group
      systems.all.push(id)
    }
    if (props.group) {
      if (!systems[props.group]) {
        initGroup(props.group)
      }
      systems[props.group].push(id)
    }
    systems.push(props)
  }

  var initGroup = function (name) {
    systems[name] = []
    system[name] = runGroup.bind(systems[name])
  }

  initGroup('all')

  var runSystem = function(ev) {
    if (ev && ev instanceof CustomEvent) {
      ev = ev.detail
    }
    if (isFunc(this.pre)) this.pre(ev)
    if (isFunc(this.every)) {
      this.coll.forEachWithComps(this.every, this, ev)
    }
    if (isFunc(this.post)) this.post(ev)
  }

  // ***********************************************
  // Entity
  //
  var Entity = function() {
    this.comps = new Array(components.length)
    this.belongsTo = new LinkedList()
  }

  Entity.prototype.add = function(compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    compId = processCompId(compId)
    if (this.comps[compId] !== undefined) throw new Error("The entity already has the component")
    if (isFunc(components[compId])) {
      this.comps[compId] = new components[compId](arg1, arg2, arg3, arg4, arg5, arg6, arg7)
    } else if (typeof components[compId] === "string") {
      var obj = {}
      obj[components[compId]] = arg1
      this.comps[compId] = obj
    } else {
      this.comps[compId] = {}
    }
    this.comps[compId].id = compId
    collectionsRequieringComp[compId].forEach(function (coll) {
      if (qualifiesForCollection(this, coll.comps)) {
        addEntityToCollection(this, coll)
      }
    }, this)
    return this
  }

  Entity.prototype.get = function(compId) {
    compId = processCompId(compId)
    return this.comps[compId]
  }

  Entity.prototype.get = function(compId) {
    compId = processCompId(compId)
    return this.comps[compId]
  }

  Entity.prototype.has = function(compId) {
    compId = processCompId(compId)
    return this.comps[compId] !== undefined
  }

  Entity.prototype.remove = function(compId) {
    compId = processCompId(compId)
    if (this.comps[compId] === undefined) throw new Error("The entity already has the component")
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
    compId = processCompId(compId)
    this.add(compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7)
    this.remove(compId)
  }

  Entity.prototype.delete = function() {
    this.belongsTo.forEach(function (collBelonging, elm) {
      collBelonging.entry.remove()
    })
  }

  var entity = Kran.entity = function () {
    var ent = new Entity()
    return ent
  }

  var CollectionBelonging = function (comps, entry) {
    this.comps = comps; this.entry = entry
  }

  var addEntityToCollection = function(ent, coll) {
    coll.arrival.forEach(function (func) {
      coll.callWithComps(ent, func)
    })
    var collEntry = coll.ents.add(ent)
    ent.belongsTo.add(new CollectionBelonging(coll.comps, collEntry))
  }

  var processCompId = function(compId) {
    if (typeof(compId) === "number") { 
      return checkComponentExistence(compId)
    } else if (typeof(compId) == "object" &&
               compId.id !== undefined) {
      return checkComponentExistence(compId.id)
    }
    throw new TypeError("Component " + compId + " does not contain any id")
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
  Kran.trigger = function(name, data) {
    var event = new CustomEvent(name, { detail: data })
    window.dispatchEvent(event)
  }

  // ***********************************************
  // Helper functions
  //
  var isFunc = function(func) {
    if (typeof(func) === 'function') {
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
