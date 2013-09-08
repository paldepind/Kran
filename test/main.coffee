component = require( '../src/main').component
system = require( '../src/main').system

describe 'component', ->
  comp = comp2 = comp3 = null

  it 'makes it possible to add components', ->
    comp = component.add( ->
      this.bar = 17
    )

  it 'stores all components and their constructor function', ->
    func1 = () -> this.x = 1
    func2 = () -> this.y = 2

    comp2 = component.add(func1)
    comp3 = component.add(func2)

    component[comp2].should.equal func1
    component[comp3].should.equal func2

  it 'sould delegate incrementing ids to component', ->
    comp.should.equal 0
    comp2.should.equal 1
    comp3.should.equal 2

  it 'can be instantiated', ->
    foo = new component[comp]()
    foo.bar.should.equal 17

describe 'system', ->
  it 'makes it opssible to add systems', ->
    sys = system.add({})
    sys.should.equal 0
    sys = system.add({})
    sys.should.equal 1

  it 'can run systems', () ->
    spy = sinon.spy()
    spy()
    spy.should.have.been.called
    sys = system.add({ pre: spy })
    system.run(sys)

  it 'can run all systems at once', ->
    spy = sinon.spy()
    system.add { pre: spy }
    system.add { post: spy }
    system.runAll()
    spy.should.have.been.calledTwice

  it 'seperates systems into groups', ->
    spy = sinon.spy()
    spy2 = sinon.spy()
    system.add { pre: spy }
    system.add { pre: spy2, group: 'thsBgrp' }
    system.add { pre: spy2, group: 'thsBgrp' }

    system.runAll()
    system.thsBgrp.run()

    spy.should.have.been.calledOnce
    spy2.callCount.should.equal 4
