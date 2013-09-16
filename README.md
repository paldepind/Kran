Kran
====

Kran is an entity system micro-framework written in JavaScript primarely
targeted at game development. Thanks to the well tested ideas of entity
component systems which Kran is based upon it offers incredible _flexibility_.
By favoring composition over inheritance, seperation of data and game logic,
loose coupling, the pub/sub pattern and dependency injection for systems Kran
provides an architecture that will get your game up to speed quickly and which
will allow it to scale smoothly as it grows.

Kran provides nothing but an _architecture_ that can be used for any kind of
game. All other decisions - like how to do rendering or physics - is up to the
user. Kran can without any problems be used in conjunction with other libraries
any for any type of game.

_Note_: Kran is under heavy development, everything is work in progess.

Why Kran?
=========

It's _flexible_
------------------
Kran gains most of its flexibility from the entity system architechture it is
an implementation of. Unlike the case with object oriented programming data
isn't tied together with the functions that processes it in restricting
objects and it doesn't have to fit inside a class hierarchy either. Entities
are simply build out data components in any way desireable. Systems just specify
what components they require an they'll automatically be handed all entities that
satisfy the declared requirements. This allows for maximum flexibility and
reuseability - nothing is tightly coupled, everything can be mixed and matched.

It's _effortless_
--------------------
Kran has a simple convinient API that makes common tasks very easy. It
provides an answer on how to structure your code so that you can worry about
actually getting your game rolling and without being hindered later on by
inflexibility or a cumbersome design making further expansions harder. It show
you the way without getting in you way.

It's _simple_
----------------
We aren't kidding when we claim that Kran is a micro-framework. We makes other
so called tiny libraries look gigantic. Kran gives you an architecture and
that's all. It tries to do only what is absolutely necessary and nothing more.
That means you can learn it quickly and easily get a complete understanding of how
it works. It won't impact your page loading time in any noticeable way either.

It's _efficient_
-------------------
Kran is designed from the buttom up with a careful and efficient usage of
datastructures and an API that doesn't introduce garbage during game runtime.
Note however that Kran is in an early stage of development and further optimizations
are reserved for the future as of know.


Example
======

```javascript
// Creates a new component named position
var position = Kran.component(function (x, y) {
  this.x = x || 0
  this.y = y || 0
}

var velocity = Kran.component(function (x, y) {
  this.x = x || 0
  this.y = y || 0
}

// Creates a new system
Kran.system({
  // The system operates on entities with pos and vel components
  components: [position, velocity],
  // When the system runs this functin will process every entity
  // that has the requested components
  every: function(pos, vel) {
    pos.x += vel.x
    pos.y += vel.y
  }
}

// Creates a new entity, adds two componets to it and initializes them
var ent = Kran.entity().add(position, 100, 50).add(velocity, 2, 4,)

// Run all systems
Kran.system.all()

ent[position].x == 102 // true
ent[position].y == 54 // true
```

Documentation
=============

*Kran.component*

*Kran.system*

*Kran.entity*
