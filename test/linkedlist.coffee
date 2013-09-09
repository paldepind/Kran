Llist = require('../src/main').LinkedList

describe 'linked list', ->
  list = null 

  beforeEach ->
    list = new Llist()

  it 'should construct an object', ->
    list.should.be.an('object')

  it 'should make it possible to add list elements', ->
    el = list.add()
    el.should.be.an('object')

  describe 'a linked list element', ->
    it 'should give access to passed data', ->
      data1 = 12
      data2 = 'tasty cake'

      el1 = list.add(data1)
      el2 = list.add(data2)

      el1.data.should.equal(data1)
      el2.data.should.equal(data2)

    it 'should point to previous and next elements', ->
      el1 = list.add()
      el2 = list.add()
      el3 = list.add()

      should.not.exist(el1.prev)
      el1.next.should.equal(el2)

      el2.prev.should.equal(el1)
      el2.next.should.equal(el3)

      el3.prev.should.equal(el2)
      should.not.exist(el3.next)

    it 'should be removeable', ->
      el1 = list.add()
      el2 = list.add()
      el3 = list.add()

      el2.remove()

      el1.next.should.equal(el3)
      el3.prev.should.equal(el1)
      
  it 'should point to the first added element', ->
    el = list.add()
    list.add()
    list.head.should.equal(el)

  it 'have both tail and head points to the same when there is only one', ->
    el = list.add()
    list.head.should.equal(el)
    list.tail.should.equal(el)

  it 'should still point to first element after removals', ->
    el1 = list.add()
    el2 = list.add()
    list.head.should.equal(el1)
    el1.remove()
    list.head.should.equal(el2)
    el2.remove()
    should.not.exist(list.head)

  it 'should point to the last added element', ->
    list.add()
    el = list.add()
    list.tail.should.equal(el)

  it 'should still point to last element after removals', ->
    el1 = list.add()
    el2 = list.add()
    list.tail.should.equal(el2)
    el2.remove()
    list.tail.should.equal(el1)
    el1.remove()
    should.not.exist(list.tail)

  it 'should allow for executing a function for every item', ->
    el1 = list.add()
    el2 = list.add()
    el3 = list.add()
    spy = sinon.spy()
    
    list.forEach(spy)
    spy.should.have.been.calledThrice
