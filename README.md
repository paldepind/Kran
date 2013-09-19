Kran
====

A flexible, convenient, simple and efficient architecture primarely for game
development. It will get your game development up to speed quickly and allow
your game to exand smoothly.

Kran provides nothing but an _architecture_ that can be used for any type of
game. All other decisions - like how to do rendering or physics - is up to the
user. Kran can without problems be used in conjunction with other libraries.

_Note_: Kran is under heavy development, everything is work in progess.

Demo game
=========
[Try the crazy demo game with explosions and blood!]
(http://paldepind.github.io/Kran/examples/circlebomb/)

_Note_: It only works in modern desktop browsers - currently only tested in Firefox and
Chrome.
![Screenshot](http://i.imgur.com/H9Qijoc.png)

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
Kran has a simple convinient API that makes common tasks very easy. It provides
structure to your code so that you can worry about actually getting your game
rolling without being hindered later on by inflexibility or a cumbersome design
that makes further expansions hard. It has an event system that integrates with
DOM events and makes using the pub/sub pattern straightforward. It shows you
the way without getting in you way.

It's _simple_:
We aren't kidding when we claim that Kran is a tiny library. We makes other
so called tiny libraries look gigantic. Kran gives you an architecture and
that's all. It has a tight focus. This means you can learn it quickly and
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
We want to make all entities that has both speed and a weight to accelerated
towards the ground. In other words we want to implement gravity. For that we need
a _system_. Systems is were the logis that would be methods in OOP is put in an
entity system.

```javascript
system({ // Creates a new system that accelerates objects with weight towards the ground
  // The system is interested in entities with velocity and weight components
  components: [velocity, weight],
  // When the system runs this functin will be called for each entity that has the
  // requested components, the components will be given as arguments to the function
  every: function(velocity, weight) {
    velocity.y += weight.val * GRAVITY
  }
}
```

That's all we have to do in order to make entities get attracted towards the
ground! The system is automatically registered inside Kran, and now when
systems are being run in the main loop the above system will automatically be
run for every entity that satisfies it's dependencies.

The final thing we need to do is compose some entities that the system can
operate on. Fortunately it's super easy! `Kran.entity` creates a new entity and
returns it. The returned entity has an `add` method that as its first argument
takes the component to add. Further arguments will be passed along to the
components constructor function. It returns the entity to allow for chaining.

```javascript
// Creates a new entity, adds two components to it and initializes them
Kran.entity().add(velocity, 100, 0).add(weight, 10)
// This component is heavy and heading right towards the ground, might be a meteor ;)
Kran.entity().add(velocity, 0, -10000).add(weight, 84782)
```

Now we set up the gameloop. This is what a simple gameloop might look like in
Kran (actually this is exactly what the demo game's loop look like):
```javascript
var gameLoop = function() {      
  system.all()
  requestAnimationFrame(gameLoop)
}  
```
The above simply runs all systems in order of creation. If more control is needed
systems can be put into groups and runned like this:
```javascript
system.groupName()
```
That's all for now. Kran is still in heavy development and more documentation
will be created in the future. As of now take a look at the 
[source code of the example game](https://github.com/paldepind/Kran/blob/master/examples/circlebomb/game.js)
for an example on how a game made with Kran can look like.

API documentation
=============
Nothing here yet.

To do
=====

* Add benchmark suite
* Add object pooling for internal and external usage
* More example games
* Possible extensions
  * JSON serialization and restoration of all state for save game
  * Socket.IO integration (highly speculative)
