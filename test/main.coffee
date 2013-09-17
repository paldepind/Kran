Kran = require( '../kran')
component = Kran.component
system = Kran.system
entity = Kran.entity

describe 'Kran:', ->

  afterEach ->
    Kran.reset()

  describe 'component', ->

    comp = null

    beforeEach ->
      comp = component(() -> @bar = 17 )

    it 'stores all components and their constructor function', ->
      func1 = () -> @x = 1
      func2 = () -> @y = 2

      comp1 = component(func1)
      comp2 = component(func2)

    it 'should delegate incrementing ids to component', ->
      comp2 = component(() -> foo)
      comp3 = component(() -> foo)
      comp.should.equal 0
      comp2.should.equal 1
      comp3.should.equal 2

    it 'can create components without a constructor', ->
      comp1 = component()

    it 'handles a single non-array component', ->
      sys = system({ components: comp })
      entity().add(comp)
      system.all()

  describe 'system', ->
    it 'makes it possible to add new systems', ->
      system({})

    it 'can run systems', () ->
      spy = sinon.spy()
      sys = system({ pre: spy, group: "sys" })
      system.sys()
      spy.should.have.been.called

    it 'can run all systems at once', ->
      spy = sinon.spy()
      system { pre: spy }
      system { post: spy }
      system.all()
      spy.should.have.been.calledTwice

    it 'seperates systems into groups', ->
      spy = sinon.spy()
      spy2 = sinon.spy()
      system { pre: spy }
      system { pre: spy2, group: 'thsBgrp' }
      system { pre: spy2, group: 'thsBgrp' }

      system.all()
      system.thsBgrp()

      spy.should.have.been.calledOnce
      spy2.callCount.should.equal 4

    it 'calls the every function for every entity', ->
      spy = sinon.spy()
      comp = component(() -> @v = 1)
      system { every: spy, components: comp }
      entity().add(comp)
      entity().add(comp)
      system.all()
      spy.should.have.been.calledTwice

    it 'doesnt call the every function if nonexistent', ->
      spy = sinon.spy()
      comp = component(() -> @v = 1)
      system { components: comp }
      entity().add(comp)
      system.all()

    it 'calls the every function with components as arguments', ->
      func = (comp2, comp) ->
        comp.v.should.equal 1
        comp2.v.should.equal 2
      comp = component(() -> @v = 1)
      comp2 = component(() -> @v = 2)
      system { every: func, components: [comp2, comp] }
      entity().add(comp).add(comp2)
      system.all()

    it 'calls pre and post with nothing', ->
      spy = sinon.spy (comp, comp2) ->
        should.not.exist(comp)
        should.not.exist(comp2)
      comp = component(() -> @v = 1)
      comp2 = component(() -> @foo = 'bar')
      system { pre: spy, post: spy, components: [comp, comp2] }
      entity().add(comp).add(comp2)
      system.all()
      spy.should.have.been.calledTwice

    it 'calls every with entity as last argument', ->
      spy = sinon.spy (x, e) ->
        e.should.equal(ent)
      comp = component(() -> @v = 1)
      system({ every: spy, components: comp })
      ent = entity().add(comp)
      system.all()

    it 'assigns proper ids in entities list', ->
      spy = sinon.spy()
      comp = component(() -> @f = 1)
      comp2 = component(() -> @f = 1)
      system({ components: comp2 })
      sys = system({ components: comp, every: spy })
      ent = entity().add(comp) # system properly stores the entities id=0
      system.all()

    it 'shares entity collections between systems if possible', ->
      comp = component()
      comp2 = component()
      sys = system({ components: [comp, comp2] })
      sys2 = system({ components: [comp, comp2] })

    it 'binds this correctly inside the every hook', ->
      comp = component()
      system({ components: comp, foo: "bar", every: () -> @foo.should.equal("bar") })
      entity().add(comp)
      system.all()

    it 'calls systems in order of creation', ->
      spy1 = sinon.spy()
      spy2 = sinon.spy()
      comp = component()
      system({ components: comp, pre: spy1 })
      system({ components: comp, pre: spy2 })
      entity().add(comp)
      system.all()
      spy1.should.have.been.calledBefore(spy2)

  describe 'entity', ->
    it 'allows for creation of new entities', ->
      entity().should.be.an('object')

    it 'can add constructor components to entities', ->
      spy = sinon.spy()
      comp = component(() -> @v = 1)
      sys = system {
        components: [comp],
        pre: spy
      }
      ent = entity()
      ent.add(comp)

    it 'can add non-constructor components to entitties', ->
      comp = component("val")
      ent = entity().add(comp, 2)
      ent2 = entity().add(comp, 3)
      ent.get(comp).val.should.equal(2)
      ent2.get(comp).val.should.equal(3)

    it 'passes the arguments given to add along to the constructor', ->
      Spy = sinon.spy((arg1, arg2, arg3) ->
        arg1.should.equal(1)
        arg2.should.equal('foo')
        arg3.should.have.length(2)
      )
      comp = component(Spy)
      entity().add(comp, 1, 'foo', ['a', 2])
      Spy.should.have.been.calledOnce

    it 'adds entities to systems when they qualify', ->
      comp = component(() -> @v = 1)
      comp2 = component(() -> @v = 1)
      comp3 = component(() -> @v = 1)
      sys = system({ components: [comp, comp3] })

      ent = entity().add(comp).add(comp2)
      should.not.exist(ent.belongsTo.head)
      ent.add(comp3)
      should.exist(ent.belongsTo.head)

    it 'allows removal of components and updates system accordingly', ->
      spy = sinon.spy()
      comp = component(() -> @v = 1)
      comp2 = component(() -> @v = 1)
      comp3 = component(() -> @v = 1)
      sys = system({ components: [comp, comp3], every: spy })

      ent = entity().add(comp).add(comp2).add(comp3)
      system.all()
      should.exist(ent.belongsTo.head)
      ent.remove(comp2)
      should.exist(ent.belongsTo.head)
      ent.remove(comp)
      should.not.exist(ent.belongsTo.head)
      system.all()
      spy.should.have.been.calledOnce

    it 'allows removal of components using component instances', ->
      spy = sinon.spy((comp, ent) ->
        ent.remove(comp)
      )
      comp = component(() -> @v = 1)
      sys = system({ components: comp, every: spy })
      ent = entity().add(comp)
      system.all()
      system.all()
      spy.should.have.been.calledOnce

    it 'makes it possible to delete entities', ->
      spy = sinon.spy()
      comp = component(() -> @v = 1)
      sys = system({ components: comp, every: spy })

      ent = entity().add(comp)
      system.all()
      ent.delete()
      system.all()
      spy.should.have.been.calledOnce

    it 'call systems arrival when entity gets added to collection', ->
      spy = sinon.spy((comp) ->
        comp.should.be.a.object
      )
      comp = component()
      comp2 = component()
      system({ components: [comp, comp2], arrival: spy })
      spy.should.not.have.been.called
      entity().add(comp, 1).add(comp2, 1)
      spy.should.have.been.calledOnce

    it 'allows triggering a component', ->
      spy = sinon.spy()
      comp = component()
      comp2 = component()
      system({ components: [comp, comp2], arrival: spy, every: spy })
      entity().add(comp).trigger(comp2, 1)
      system.all()
      spy.should.have.been.calledOnce
