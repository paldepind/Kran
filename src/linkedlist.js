function LinkedList() {
  this.head = null
  this.tail = null
}

function Element(data, list) {
  this.data = data
  this.list = list 
  this.prev = list.head
  this.next = null
}

Element.prototype.remove = function() {
  if (this.prev) {
    this.prev.next = this.next
  } else {
    this.list.tail = this.next
  }
  if (this.next) {
    this.next.prev = this.prev
  } else {
    this.list.head = this.prev
  }
}

LinkedList.prototype.add = function(data) {
  var elm = new Element(data, this)
  if (this.head) {
    this.head.next = elm
  } else {
    this.tail = elm
  }
  this.head = elm

  return elm
}

module.exports = LinkedList
