component = require( '../src/main').component
system = require( '../src/main').system
entity = require( '../src/main').entity

describe 'Kran:', ->

  afterEach ->
    component.length = 0
    system.length = 0
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

    it 'keeps track of which systems includes it', ->
      comp2 = component.new(() -> foo)
      comp3 = component.new(() -> foo)
      sys = system.new({
        components: [comp, comp3]
      })
      component[comp].belongsTo[0].should.equal(sys)
      component[comp3].belongsTo[0].should.equal(sys)
      component[comp2].belongsTo.length.should.equal(0)

    it 'handles a single non-array component', ->
      sys = system.new({
        components: comp
      })
      component[comp].belongsTo[0].should.equal(sys)

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
      system.runAll()
      spy.should.have.been.calledTwice

    it 'seperates systems into groups', ->
      spy = sinon.spy()
      spy2 = sinon.spy()
      system.new { pre: spy }
      system.new { pre: spy2, group: 'thsBgrp' }
      system.new { pre: spy2, group: 'thsBgrp' }

      system.runAll()
      system.thsBgrp.run()

      spy.should.have.been.calledOnce
      spy2.callCount.should.equal 4

    it 'calls the every function for every entity', ->
      spy = sinon.spy()
      comp = component.new(() -> @v = 1)
      system.new { every: spy, components: comp }
      entity.new().add(comp)
      entity.new().add(comp)
      system.runAll()
      spy.should.have.been.calledTwice

    it 'calls the every function with components as arguments', ->
      func = (comp2, comp) ->
        comp.v.should.equal 1
        comp2.v.should.equal 2
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 2)
      system.new { every: func, components: [comp2, comp] }
      entity.new().add(comp).add(comp2)
      system.runAll()

    it 'calls arrival and departure with proper components arguments', ->
      spy = sinon.spy (comp, comp2) ->
        comp2.v.should.equal 1
        comp.v.should.equal 2
      comp = component.new(() -> @v = 1)
      comp2 = component.new(() -> @v = 2)
      system.new { arrival: spy, departure: spy, components: [comp2, comp] }
      entity.new().add(comp).add(comp2).remove(comp)
      spy.should.have.been.calledTwice

  describe 'entity', ->
    it 'allows for creation of new entities', ->
      entity.new().id.should.equal 0
      entity.new().id.should.equal 1
      entity.new().id.should.equal 2

    it 'can add components to entities', ->
      spy = sinon.spy()
      comp = component.new(() -> @v = 1)
      sys = system.new {
        components: [comp],
        pre: spy
      }
      component[comp].belongsTo[0].should.equal(sys)
      ent = entity.new()
      ent.add(comp)
      system[sys].entities.head.data.should.equal ent.id

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
