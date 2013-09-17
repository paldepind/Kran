(function () {
  var c = Kran.component
  var s = Kran.system
  var e = Kran.entity

  // Globals
  var render = document.getElementById('render').getContext('2d')
  var mouse = { x: 0, y: 0 }
  var timeToMonster = 100;
  var timeBetweenMonsters = 100

  // Components

  var growing = c("speed")
  var goingToExplode = c("in")
  var damage = c("giving")
  var weight = c("val")
  var collided = c("with")
  var health = c("left")
  var player = c()
  var monster = c()
  var explosion = c()
  var background = c()
  var follow = c(function (pos, s) {
    this.pos = pos;
    this.speed = s
  })
  var pulsing = c(function(size, speed) {
    this.maxSize = size;
    this.curSize = 0
    this.speed = speed
  })
  var disappering = c(function (t) {
    this.time = t
    this.curTime = t
  })
  var circle = c(function (x, y, r) {
    this.x = x || 0
    this.y = y || 0
    this.radius = r || 20
  })
  var color = c(function (r, g, b, a) {
    this.r = r || 0; this.g = g || 0; this.b = b || 0; this.a = a || 1;
  })

  // Systems
  s({ // Render
    components: [circle, color],
    background: [], // Store entities that should be rendered in the background
    pre: function() {
      var ent
      render.clearRect(0, 0, render.canvas.width, render.canvas.height)
      while (this.background.length > 0) {
        ent = this.background.pop()
        if (ent[circle] && ent[color])
          this.renderCircle(ent[circle], ent[color])
      }
    },
    every: function(circle, color, ent) {
      if (ent[background]) {
        this.background.push(ent)
      } else {
        this.renderCircle(circle, color)
      }
    },
    renderCircle: function(circle, color) {
      if (circle.radius <= 0) return;
      render.beginPath()
      render.fillStyle = colorString(color.r, color.g, color.b, color.a)
      render.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2, false)
      render.fill()
    },
  })
  s({ // Resize
    on: ['load', 'resize'],
    pre: function(ev) {
      render.canvas.width = document.body.clientWidth
      render.canvas.height = document.body.clientHeight
    }
  })
  s({ // Update mouse coordinates
    on: 'mousemove',
    pre: function(ev) {
      mouse.x = ev.clientX
      mouse.y = ev.clientY
    }
  })
  s({ // Follow mouse
    components: [circle, follow],
    every: function(circle, follow) {
      var dx = follow.pos.x - circle.x
      var dy = follow.pos.y - circle.y
      var dir = Math.atan2(dy, dx)
      var moveDist = Math.sqrt(Math.min(dx*dx + dy*dy, follow.speed*follow.speed))
      circle.x += Math.cos(dir) * moveDist
      circle.y += Math.sin(dir) * moveDist
    }
  })
  s({ // Fade out disappering entities
    components: [disappering, color],
    every: function(dis, color, ent) {
      dis.curTime--
      color.a = dis.curTime / dis.time
      if (dis.curTime <= 0) { ent.delete(); }
    }
  })
  s({ // Create explosion
    on: "explosion",
    pre: function(ev) {
      e().add(circle, ev.x, ev.y, 10).add(color, 255, 80, 0).add(damage, 10).add(explosion)
              .add(disappering, 20).add(growing, 5).add(weight, Infinity)
      e().add(circle, ev.x, ev.y, 7).add(color, 255, 255, 0)
              .add(disappering, 20).add(growing, 3.5)
      e().add(circle, ev.x, ev.y, 1).add(color, 255, 255, 255)
              .add(disappering, 20).add(growing, 1)
    }
  })
  s({ // Countdown to and trigger explosion
    components: [circle, goingToExplode],
    every: function(circle, gointToExplode, ent) {
      gointToExplode.in -= 1
      if (gointToExplode.in <= 0) {
        Kran.trigger("explosion", { x: circle.x, y: circle.y } )
        ent.delete()
      }
    }
  })
  s({ // Grow circle
    components: [circle, growing],
    every: function(circle, growing, ent) {
      circle.radius += growing.speed
    }
  })
  s({ // Place bomb
    on: "mousedown",
    pre: function(ev) {
      e().add(circle, ev.clientX, ev.clientY, 10).add(color, 100, 0, 0)
         .add(goingToExplode, 100).add(pulsing, 3, 0.15)
         .add(weight, 100)
    }
  })
  s({ // Change size of pulsing circles
    components: [circle, pulsing],
    every: function(circle, pulsing) {
      circle.radius += pulsing.speed
      pulsing.curSize += pulsing.speed
      if (pulsing.curSize >= pulsing.maxSize) {
        circle.radius -= pulsing.curSize
        pulsing.curSize = 0
      }
    }
  })
  s({ // Detect collisions
    components: [circle, weight],
    pre: function() {
      Kran.getEntities([circle, weight]).forEach(function (ent1, elm) {
        var ent2
        while((elm = elm.next) && (ent2 = elm.data)) {
          if (!ent1[weight]) break;
          handleCollision(ent1, ent2)
        }
      }, this)
    }
<<<<<<< HEAD
  },
  { // Makes explosions deal damage
    components: [c.collided, c.circle, c.health],
=======
  })
  s({ // Make explosions deal damage
    components: [collided, circle, health],
>>>>>>> ffc181e8a53dcbcc25b11f6b2a2dbbb9117672cc
    arrival: function(collided, circle, h, ent) {
      if (collided.with[explosion]) {
        dealDamage(h, circle, collided.with[damage], ent)
      }
    }
<<<<<<< HEAD
  },
  { // Makes the player take damage from monsters
    components: [c.collided, c.circle, c.health, c.player],
    arrival: function(collided, circle, health, player, ent) {
      if (collided.with[c.monster]) {
        dealDamage(health, circle, collided.with[c.damage], ent)
=======
  })
  s({ // Makes the player take damage from monsters
    components: [collided, circle, health, player],
    arrival: function(collided, circle, h, player, ent) {
      if (collided.with[monster]) {
        dealDamage(h, circle, collided.with[damage], ent)
>>>>>>> ffc181e8a53dcbcc25b11f6b2a2dbbb9117672cc
      }
    }
  })

<<<<<<< HEAD
  // Global entities
  var playerEnt = entity().add(c.circle, 600, 152, 20).add(c.color).add(c.player)
                 .add(c.weight, 10).add(c.follow, mouse, 8).add(c.health, 500)
=======
  // Game globals

  var playerEnt = e().add(circle, 600, 152, 20).add(color).add(player)
                     .add(weight, 10).add(follow, mouse, 8).add(health, 500)
  var timeToMonster = 100;
  var timeBetweenMonsters = 100
>>>>>>> ffc181e8a53dcbcc25b11f6b2a2dbbb9117672cc

  var gameLoop = function() {
    s.all()
    requestAnimationFrame(gameLoop)
    if (--timeToMonster <= 0) {
      createMonster();
      timeBetweenMonsters -= 10
      timeToMonster = Math.max(timeBetweenMonsters, 50)
    }
  }
  gameLoop()

  // Helper functions
  
  function createMonster() {
    var x = render.canvas.width * Math.random()
    var y = render.canvas.height * Math.round(Math.random())
    var radius = 10 + 40 * Math.random()
    var speed = 1 + 4 * Math.random()
    var red = Math.floor(50 + 150 * Math.random())
    var green = Math.floor(50 + 150 * Math.random())
    var blue = Math.floor(50 + 150 * Math.random())
    e().add(circle, x, y, radius).add(color, red, green, blue).add(weight, 50)
            .add(follow, playerEnt[circle], speed).add(health, 110).add(damage, 8).add(monster)
  }

  function dealDamage(h, circle, damage, ent) {
    h.left -= damage.giving
    if (h.left <= 0) {
      if (ent[player]) {
        alert("You died! Refresh the page to replay")
      }
      ent.remove(health)
      if (ent[follow]) ent.remove(follow)
      if (ent[weight]) ent.remove(weight)
      ent.add(disappering, 30)
      timeBetweenMonsters += 5
    }
    bloodSplatter(circle)
  }

  function bloodSplatter(circ) {
    var x = circ.x - circ.radius / 2 + circ.radius * Math.random()
    var y = circ.y - circ.radius / 2 + circ.radius * Math.random()
    e().add(circle, x, y, circ.radius * Math.random())
       .add(color, 155, 0, 0)
       .add(growing, -0.04)
       .add(disappering, 400)
       .add(background)
  }

  function colorString(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")"
  }

  function handleCollision(ent1, ent2) {
    var pos1 = ent1[circle], pos2 = ent2[circle]
      , weight1 = ent1[weight].val, weight2 = ent2[weight].val
      , dx = pos2.x - pos1.x
      , dy = pos2.y - pos1.y
      , overlap = pos1.radius + pos2.radius - Math.sqrt(dx*dx+dy*dy)
      , dir, distribution1, distribution2
    if (overlap > 0) {
      dir = Math.atan2(dy, dx)
      totalWeight = weight2 + weight1
      distribution1 = weight2 / totalWeight
      if (isNaN(distribution1)) distribution1 = 1
      distribution2 = weight1 / totalWeight
      if (isNaN(distribution2)) distribution2 = 1
      pos1.x -= Math.cos(dir) * (overlap * distribution1)
      pos1.y -= Math.sin(dir) * (overlap * distribution1)
      pos2.x += Math.cos(dir) * (overlap * distribution2)
      pos2.y += Math.sin(dir) * (overlap * distribution2)
      ent1.trigger(collided, ent2)
      ent2.trigger(collided, ent1)
    }
  }

})(Kran)
