component = require( '../kran').component
system = require( '../kran').system
entity = require( '../kran').entity

describe 'Kran:', ->

  afterEach ->
    component.reset()
    system.length = 0
    system.all.length = 0
    entity.length = 0

  describe 'component', ->

    comp = null

    beforeEach ->
      comp = component.new( -> @bar = 17 )

    it 'stores all components and their constructor function', ->
      func1 = () -> @x = 1
      func2 = () -> @y = 2

      comp1 = component.new(func1)
      comp2 = component.new(func2)

      component[comp1].should.equal func1
      component[comp2].should.equal func2

    it 'should delegate incrementing ids to component', ->
      comp2 = component.new(() -> foo)
      comp3 = component.new(() -> foo)
      comp.should.equal 0
      comp2.should.equal 1
      comp3.should.equal 2

    it 'can be instantiated', ->
      foo = new component[comp]()
      foo.bar.should.equal 17

    it 'handles a single non-array component', ->
      sys = system.new({
        components: comp
      })
      entity.new().add(comp)
      system.all.run()

  describe 'system', ->
    it 'makes it possible to add new systems', ->
      sys = system.new({})
      sys.should.equal 0
      sys = system.new({})
      sys.should.equal 1

    it 'can run systems', () ->
      spy = sinon.spy()
      spy()
      spy.should.have.been.called
      sys = system.new({ pre: spy })
      system[sys].run()

    it 'can run all systems at once', ->
      spy = sinon.spy()
      system.new { pre: spy }
      system.new { post: spy }
      system.all.run()
      spy.should.have.been.calledTwice

    it 'seperates systems into groups', ->
      spy = sinon.spy()
      spy2 = sinon.spy()
      system.new { pre: spy }
      system.new { pre: spy2, group: 'thsBgrp' }
      system.new { pre: spy2, group: 'thsBgrp' }

      system.all.run()
      system.thsBgrp.run()

      spy.should.have.been.calledOnce
      spy2.callCount.should.equal 4

    it 'calls the every function for every entity', ->
      spy = sinon.spy()
      comp = component.new(() -> @v = 1)
      system.new { every: spy, components: comp }
      entity.new().add(comp)
      entity.new().add(comp)
      system.all.run()
      spy.should.have.been.calledTwice

    it 'doesnt call the every function if nonexistent', ->
      spy = sinon.spy()
      comp = component.new(() -> @v = 1)
      system.new { components: comp }
      entity.new().add(comp)
      system.all.run()

    it 'calls the every function with components as arguments', ->
      func = (comp2, comp) ->
        comp.v.should.equal 1
        comp2.v.should.equal 2
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 2)
      system.new { every: func, components: [comp2, comp] }
      entity.new().add(comp).add(comp2)
      system.all.run()

    it 'calls arrival and departure with proper components arguments', ->
      spy = sinon.spy (comp, comp2) ->
        comp2.v.should.equal 1
        comp.v.should.equal 2
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 2)
      system.new { arrival: spy, departure: spy, components: [comp2, comp] }
      entity.new().add(comp).add(comp2).remove(comp)
      spy.should.have.been.calledTwice

    it 'calls pre and post with components if they arent constructor functions', ->
      spy = sinon.spy (comp, comp2) ->
        should.not.exist(comp)
        comp2.foo.should.equal('bar')
      comp = component.new(() -> @v = 1)
      comp2 = component.new({ foo: 'bar' })
      system.new { pre: spy, post: spy, components: [comp, comp2] }
      entity.new().add(comp).add(comp2)
      system.all.run()
      spy.should.have.been.calledTwice

    it 'assigns proper ids in entities list', ->
      spy = sinon.spy()
      comp = component.new(() -> @f = 1)
      comp2 = component.new(() -> @f = 1)
      system.new({ components: comp2 })
      sys = system.new({ components: comp, every: spy })
      ent = entity.new().add(comp) # system properly stores the entities id=0
      system.all.run()
      system[sys].entities.head.data.should.equal ent.id

  describe 'entity', ->
    it 'allows for creation of new entities', ->
      entity.new().id.should.equal 0
      entity.new().id.should.equal 1
      entity.new().id.should.equal 2

    it 'can add constructor components to entities', ->
      spy = sinon.spy()
      comp = component.new(() -> @v = 1)
      sys = system.new {
        components: [comp],
        pre: spy
      }
      ent = entity.new()
      ent.add(comp)

    it 'can add non-constructor object components to entitties', ->
      obj = { foo: 'bar' }
      comp = component.new(obj)
      ent = entity.new().add(comp)
      ent2 = entity.new().add(comp)
      ent[comp].should.equal(obj)
      ent2[comp].should.equal(obj)

    it 'can add primitive components to entitties', ->
      comp = component.new(1)
      ent = entity.new().add(comp)

    it 'passes the arguments given to add along to the constructor', ->
      Spy = sinon.spy((arg1, arg2, arg3) ->
        arg1.should.equal(1)
        arg2.should.equal('foo')
        arg3.should.have.length(2)
      )
      comp = component.new(Spy)
      entity.new().add(comp, 1, 'foo', ['a', 2])
      Spy.should.have.been.calledOnce

    it 'adds entities to systems when they qualify', ->
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 1)
      comp3 = component.new(() -> @v = 1)
      sys = system.new({ components: [comp, comp3] })

      ent = entity.new().add(comp).add(comp2)
      should.not.exist(ent.belongsTo.head)
      ent.add(comp3)
      should.exist(ent.belongsTo.head)

    it 'allows removal of components and updates system accordingly', ->
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 1)
      comp3 = component.new(() -> @v = 1)
      sys = system.new({ components: [comp, comp3] })

      ent = entity.new().add(comp).add(comp2).add(comp3)
      should.exist(ent.belongsTo.head)
      ent.remove(comp2)
      should.exist(ent.belongsTo.head)
      ent.remove(comp)
      should.not.exist(ent.belongsTo.head)
