Kran
====

Kran is an entity system micro-framework written in JavaScript primarely
targeted at game development. Thanks to the well tested ideas of entity
component systems which Kran is based upon it offers incredible _flexibility_.
An entity system favors composition over inheritance and enforces seperation of
data and game logic. This leads to loose coupling. Kran furthermore provides
means for using the pub/sub pattern, dependency injection for systems and
a convenient API. That's sure is a lot of buzzwords but all in all it makes for
an architecture that will get your game up to speed quickly and which
will allow it to exand smoothly.

Kran provides nothing but an _architecture_ that can be used for any type of
game. All other decisions - like how to do rendering or physics - is up to the
user. Kran can without problems be used in conjunction with other libraries.

_Note_: Kran is under heavy development, everything is work in progess.

Demo game
=========
[Try the crazy demo game with explosion and blood!]
(http://paldepind.github.io/Kran/examples/circlebomb/)

_Note_: It only works in modern browsers - currently only tested in Firefox and
Chrome. The tearing in the image below is for some reason introduced when
taking a screenshot.
![Screenshot](http://i.imgur.com/6N0gzYX.png "Screenshot of demo game")

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
var GRAVITY = 9.8

var velocity = Kran.component(function (x, y) {
  this.x = x || 0
  this.y = y || 0
}

// Create a weight component using the shorhand syntax for components
// with just one property (we call it val in lack of a better name)
var weight = component("val")

// Creates a new system that accelerates objects with weight towards the ground
Kran.system({
  // The system operates on entities with velocity and weight components
  components: [velocity, weight],
  // When the system runs this functin will process every entity that has the
  // requested components, the components will be given as arguments to the function
  every: function(velocity, weight) {
    velocity.y += weight.val * GRAVITY
  }
}

// Creates a new entity, adds two componets to it and initializes them
var ent = Kran.entity().add(velocity, 100, 0).add(weight, 10)

// Run all systems (this typically happens inside the main loop)
Kran.system.all()

// The velocity will be accelerated one time step forward
ent[velocity].y === 98 // true
```

Documentation
=============

Not there yet.

*Kran.component*

*Kran.system*

*Kran.entity*

To do
=====

* Add benchmark suite
* Add object pooling for internal and external usage
* More example games
* Socket.IO integration (highly speculative)
