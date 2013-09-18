Kran
====

A flexible, convenient, simple and efficient architecture primarely for game
development.

Thanks to the well tested ideas of entity
component systems which Kran is based upon it offers incredible _flexibility_.
It favors composition over inheritance and enforces seperation of
data and game logic. Data is contained inside components and logic inside
systems - this leads to loose coupling. Kran furthermore provides means for using
the pub/sub pattern, dependency injection for systems and a convenient API.
The sum of it all is an architecture that will get your game up to speed
quickly and which will allow it to exand smoothly.

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

It's _flexible_:
Kran gains most of its flexibility from the entity system architechture which it is
an implementation of. Unlike the case with object oriented programming data
isn't tied together with the functions that processes it in. And you don't have
to fit things inside an inflexible class hierarchy to share code. In Kran
entities are created by composition rather than inheritance. They can be
composed out of any combination of data components desireable and they'll
automatically find their way to the functions that wants to operate on them.
This allows for maximum flexibility and reuseability - nothing is tightly
coupled, everything can be mixed and matched.

It's _effortless_:
Kran has a simple convinient API that makes common tasks very easy. It
provides structure to your code so that you can worry about actually getting
your game rolling and without being hindered later on by inflexibility or a
cumbersome design making further expansions harder. It shows you the way
without getting in you way.

It's _simple_:
We aren't kidding when we claim that Kran is a tiny library. We makes other
so called tiny libraries look gigantic. Kran gives you an architecture and
that's all. It has a tight focus. That means you can learn it quickly and
easily get a complete understanding of how it works. It won't impact your page
loading time in any noticeable way either.

It's _efficient_: Kran is designed from the buttom up with an efficient use of
datastructures and an API that doesn't introduce garbage during game runtime.
Note however that Kran is in an early stage of development and the optimization
isn't done.

Crash course
============

In an entity system all data/state is stored inside _components_. Components
are tiny bits of tightly related data. It's a property/characteristic that
a thing can possess. That could be a position component, a shape component
or a color component. In Kran a component can be defined by passing a
constructor function to `Kran.component`:

```javascript
var velocity = Kran.component(function (x, y) {
  this.x = x || 0
  this.y = y || 0
}
```

Components with just one property can be created using the shorthand syntax
shown below
```javascript
var weight = component("val")
```
This is the same as doing
```javascript
var weight = component(function (weight) {
  this.val = weight
}
```

We've now created two components. A velocity component and a weight component.
We want it to so that all entities that has both a speed and a weight gets
accelerated towards the ground. In other words we want to create gravity.
For that we need a _system_. This is were the logis is put in an entity
system.

```javascript
system({ // Creates a new system that accelerates objects with weight towards the ground
  // The system operates on entities with velocity and weight components
  components: [velocity, weight],
  // When the system runs this functin will process every entity that has the
  // requested components, the components will be given as arguments to the function
  every: function(velocity, weight) {
    velocity.y += weight.val * GRAVITY
  }
}
```

That's all we have to do in order to make entities get attracted towards the
ground! Now when systems are being run in the main loop the above system will
automatically be run for every entity that satisfies it's dependencies.

But how do we compose those entities? It's actually super easy. `Kran.entity`
creates a new entity and returns it. The returned entity has a `add` method
that as its first argument takes the component to add and then the arguments
to pass along to the components constructor function.

```javascript
// Creates a new entity, adds two components to it and initializes them
Kran.entity().add(velocity, 100, 0).add(weight, 10)
// This component is heavy and heading right towards the ground, might be a meteor ;)
Kran.entity().add(velocity, 0, -10000).add(weight, 84782)
```

This is what a simple gameloop might look like in Kran (actually this is exactly
what the demo games loop look like):
```javascript
var gameLoop = function() {      
  system.all()
  requestAnimationFrame(gameLoop)
}  
```
The above simply runs all systems in order of creation. If more controll is needed
they can be put into groups and runned like this:
```javascript

API documentation
=============

As of now, refer to the crash course above and the source code of the example game.

To do
=====

* Add benchmark suite
* Add object pooling for internal and external usage
* More example games
* Socket.IO integration (highly speculative)
