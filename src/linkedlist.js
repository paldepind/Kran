function LinkedList() {
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

module.exports = LinkedList
