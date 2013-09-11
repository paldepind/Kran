(function () {

  var Kran = {}

  // ***********************************************
  // Component
  //
  var component = Kran.component = []
  var systemsRequieringComp = []

  component.new = function(comp) {
    systemsRequieringComp.push([])
    this.push(comp)
    return this.length - 1
  }

  component.reset = function() {
    this.length = 0
    systemsRequieringComp.length = 0
  }

  // ***********************************************
  // System
  //
  var system = Kran.system = []

  var runGroup = function() {
    for (var i = 0; i < this.length; i++)
      system[this[i]].run()
  }

  var initGroup = function (name) {
    system[name] = []
    system[name].run = runGroup
  }

  initGroup('all')

  system.new = function(props) {
    var id = this.length
    var bufferLength = 0
    props.entities = new LinkedList()
    props.run = runSystem

    if (props.components !== undefined) {
      props.components = wrapInArray(props.components)
      props.components.forEach(function (compId) {
        systemsRequieringComp[compId].push(id)
      })
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
        if (!this[props.group]) {
          initGroup(props.group)
        }
        this[props.group].push(id)
      }
      this.all.push(id)
    }
    props.compsBuffer = new Array(bufferLength)
    this.push(props)
    return id
  }

  var runSystem = function(ev) {
    callPreOrPost(this.pre, this.components, this.compsBuffer, ev)

    if (isFunc(this.every)) {
      this.entities.forEach(function (entId) { // Call every
        callFuncWithCompsFromArr(this.components, this.compsBuffer,
                                 entity[entId], this.every, ev)
      }, this)
    }
    callPreOrPost(this.post, this.components, this.compsBuffer, ev)
  }

  var callFuncWithCompsFromArr = function(comps, buffer, arr, func, ev) {
    if (ev) buffer[0] = ev
    for (var i = 0; i < comps.length; i++) {
      if (isFunc(arr[comps[i]])) {
        buffer[i + (ev ? 1 : 0)] = undefined
      } else {
        buffer[i + (ev ? 1 : 0)] = arr[comps[i]]
      }
    }
    func.apply(this, buffer)
  }

  var callPreOrPost = function(preOrPost, comps, compsBuffer, ev) {
    if (isFunc(preOrPost)) {
      if (comps) {
        callFuncWithCompsFromArr(comps, compsBuffer, component, preOrPost, ev)
      } else {
        preOrPost(ev)
      }
    }
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

  var systemBelonging = function (id, entry) {
    this.id = id; this.entry = entry
  }

  var addComponent = function(compId, arg1, arg2, arg3, arg4, arg5, arg6) {
    var sysEntry, sys

    if (this[compId !== undefined]) throw "The entity already has the component"
    if (typeof(component[compId]) === 'function') {
      this[compId] = new component[compId](arg1, arg2, arg3, arg4, arg5, arg6)
    } else {
      this[compId] = component[compId]
    }
    systemsRequieringComp[compId].forEach(function (sysId) {
      if (qualifiesForSystem(this, sysId)) {
        sys = system[sysId]
        sysEntry = sys.entities.add(this.id)
        this.belongsTo.add(new systemBelonging(sysId, sysEntry))
        if (sys.arrival) {
          callFuncWithCompsFromArr(sys.components,
            sys.compsBuffer, this, sys.arrival)
        }
      }
    }, this)
    return this
  }

  var removeComponent = function(compId) {
    var sys
      
    var tempComp = this[compId]
    this.belongsTo.forEach(function (sysInf, elm) {
      this[compId] = undefined
      if (!qualifiesForSystem(this, sysInf.id)) {
        this[compId] = tempComp
        sys = system[sysInf.id]
        sysInf.entry.remove()
        elm.remove()
        if (sys.departure) {
          callFuncWithCompsFromArr(sys.components,
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
