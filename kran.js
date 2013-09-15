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
    if (isFunc(comp)) {
      components.push(comp)
    } else if (comp === undefined) {
      components.push(true)
    } else {
      throw new TypeError("Argument " + comp + " is given but not a function")
    }
    collectionsRequieringComp.push([])
    return components.length - 1
  }

  // ***********************************************
  // Entity collections
  //
  var entityCollections = {}

  var EntityCollection = function(comps) {
    this.comps = comps
    this.ents = new LinkedList()
    this.listeners = {}
  }

  var getOrCreateEntityCollection = function(comps) {
    var key = comps.slice(0).sort().toString()
    if (entityCollections[key]) {
      return entityCollections[key]
    } else {
      var coll = new EntityCollection(comps)
      comps.forEach(function (compId) {
        if (components[compId] === undefined)
          throw new Error("Component " + compId + " does no exist")
        collectionsRequieringComp[compId].push(coll)
      })
      entityCollections[key] = coll
      return coll
    }
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
    for (var i = 0; i < arguments.length; i++) {
      addSystem(arguments[i])
    }
  }

  var addSystem = function(props) {
    var id = systems.length
    var bufferLength = 1
    props.run = runSystem

    if (props.components !== undefined) {
      props.components = wrapInArray(props.components)
      props.entities = getOrCreateEntityCollection(props.components).ents
      bufferLength += props.components.length
    }
    if (props.on) {
      props.on = wrapInArray(props.on)
      props.on.forEach(function (event) {
        window.addEventListener(event, props.run.bind(props))
      })
      bufferLength += props.on.length
    } else {
      if (props.group) {
        if (!systems[props.group]) {
          initGroup(props.group)
        }
        systems[props.group].push(id)
      }
      systems.all.push(id)
    }
    props.compsBuffer = new Array(bufferLength)
    systems.push(props)
    return id
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
      this.entities.forEach(function (ent) { // Call every
        callFuncWithCompsFromEnt(this.components, this.compsBuffer,
                                 ent, this.every, ev)
      }, this)
    }
    if (isFunc(this.post)) this.post(ev)
  }

  var callFuncWithCompsFromEnt = function(comps, buffer, ent, func, ev) {
    if (ev) buffer[0] = ev
    for (var i = 0; i < comps.length; i++) {
      buffer[i + (ev ? 1 : 0)] = ent[comps[i]]
    }
    buffer[i] = ent
    func.apply(this, buffer)
  }

  // ***********************************************
  // Listener
  //
  var listener = Kran.listenerNew

  // ***********************************************
  // Entity
  //
  var entity = Kran.entity = function () {
    // Entities wants to 'subtype' native Arrays but ECMAScript 5
    // does not support this. This wrapper function get the job done.
    var ent = new Array(components.lenght)
    ent.add = addComponent
    ent.remove = removeComponent
    ent.delete = removeEntity
    ent.belongsTo = new LinkedList()
    return ent
  }

  var CollectionBelonging = function (comps, entry) {
    this.comps = comps; this.entry = entry
  }

  var addComponent = function(compId, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    if (this[compId !== undefined]) throw new Error("The entity already has the component")
    if (typeof(components[compId]) === 'function') {
      this[compId] = new components[compId](arg1, arg2, arg3, arg4, arg5, arg6, arg7)
    } else {
      this[compId] = { val: arg1 }
    }
    collectionsRequieringComp[compId].forEach(function (coll) {
      if (qualifiesForCollection(this, coll.comps)) {
        addEntityToCollection(this, coll)
      }
    }, this)
    return this
  }

  var addEntityToCollection = function(ent, coll) {
    var collEntry = coll.ents.add(ent)
    ent.belongsTo.add(new CollectionBelonging(coll.comps, collEntry))
  }

  var removeComponent = function(compId) {
    this[compId] = undefined
    this.belongsTo.forEach(function (collBelonging, elm) {
      if (!qualifiesForCollection(this, collBelonging.comps)) {
        collBelonging.entry.remove()
        elm.remove()
      }
    }, this)
  }

  var removeEntity = function() {
    this.belongsTo.forEach(function (collBelonging, elm) {
      collBelonging.entry.remove()
    })
  }

  var qualifiesForCollection = function (ent, comps) {
    return comps.every(function (compId) {
      if (ent[compId] === undefined) {
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
