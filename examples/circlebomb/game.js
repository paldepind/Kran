(function () {
  var component = Kran.component
  var system = Kran.system
  var entity = Kran.entity

  // Globals
  var render = document.getElementById('render').getContext('2d')
  var mouse = { x: 0, y: 0 }
  var timeToMonster = 100;
  var timeBetweenMonsters = 100

  // Components

  var growing = component("speed")
  var goingToExplode = component("in")
  var damage = component("giving")
  var weight = component("val")
  var collided = component("with")
  var health = component("left")
  var player = component()
  var monster = component()
  var explosion = component()
  var background = component()
  var exploded = component()
  var follow = component(function (pos, s) {
    this.pos = pos;
    this.speed = s
  })
  var pulsing = component(function(size, speed) {
    this.maxSize = size;
    this.curSize = 0
    this.speed = speed
  })
  var disappering = component(function (t) {
    this.time = t
    this.curTime = t
  })
  var circle = component(function (x, y, r) {
    this.x = x || 0
    this.y = y || 0
    this.radius = r || 20
  })
  var color = component(function (r, g, b, a) {
    this.r = r || 0; this.g = g || 0; this.b = b || 0; this.a = a || 1;
  })

  // Systems
  system({ // Render
    components: [circle, color],
    background: [], // Store entities that should be rendered in the background
    pre: function() {
      var ent
      render.clearRect(0, 0, render.canvas.width, render.canvas.height)
      while (this.background.length > 0) {
        ent = this.background.pop()
        if (ent.has(circle) && ent.has(color))
          this.renderCircle(ent.get(circle), ent.get(color))
      }
    },
    every: function(circle, color, ent) {
      if (ent.has(background)) {
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
  system({ // Resize
    on: ['load', 'resize'],
    pre: function(ev) {
      render.canvas.width = document.body.clientWidth
      render.canvas.height = document.body.clientHeight
    }
  })
  system({ // Update mouse coordinates
    on: 'mousemove',
    pre: function(ev) {
      mouse.x = ev.clientX
      mouse.y = ev.clientY
    }
  })
  system({ // Follow mouse
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
  system({ // Fade out disappering entities
    components: [disappering, color],
    every: function(dis, color, ent) {
      dis.curTime--
      color.a = dis.curTime / dis.time
      if (dis.curTime <= 0) { ent.delete(); }
    }
  })
  system({ // Create explosion
    components: [exploded, circle],
    arrival: function(exploded, circle) {
      var x = circle.x, y = circle.y
      entity().add(circle, x, y, 10).add(color, 255, 80, 0).add(damage, 10).add(explosion)
              .add(disappering, 20).add(growing, 8).add(weight, Infinity)
      entity().add(circle, x, y, 7).add(color, 255, 255, 0)
              .add(disappering, 20).add(growing, 6)
      entity().add(circle, x, y, 1).add(color, 255, 255, 255)
              .add(disappering, 20).add(growing, 2)
    }
  })
  system({ // Countdown to and trigger explosion
    components: [circle, goingToExplode],
    every: function(circle, gointToExplode, ent) {
      gointToExplode.in -= 1
      if (gointToExplode.in <= 0) {
        ent.trigger(exploded)
        ent.delete()
      }
    }
  })
  system({ // Grow circle
    components: [circle, growing],
    every: function(circle, growing, ent) {
      circle.radius += growing.speed
    }
  })
  system({ // Place bomb
    on: "mousedown",
    pre: function(ev) {
      entity().add(circle, ev.clientX, ev.clientY, 10).add(color, 100, 0, 0)
              .add(goingToExplode, 100).add(pulsing, 3, 0.15)
              .add(weight, 100)
    }
  })
  system({ // Change size of pulsing circles
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
  system({ // Detect collisions
    components: [circle, weight],
    pre: function() {
      Kran.getEntityCollection([circle, weight]).ents.forEach(function (ent1, elm) {
        var ent2
        while((elm = elm.next) && (ent2 = elm.data)) {
          if (!ent1.has(weight)) break;
          handleCollision(ent1, ent2)
        }
      }, this)
    }
  })
  system({ // Makes one bombs explosion trigger another bomb
    components: [collided, goingToExplode],
    arrival: function(collided, goingToExplode) {
      if (collided.with.has(explosion)) {
        goingToExplode.in = 0
      }
    }
  })
  system({ // Makes explosions deal damage
    components: [collided, circle, health],
    arrival: function(collided, circle, health, ent) {
      if (collided.with.has(explosion)) {
        dealDamage(health, circle, collided.with.get(damage), ent)
      }
    }
  })
  system({ // Makes the player take damage from monsters
    components: [collided, circle, health, player],
    arrival: function(collided, circle, health, player, ent) {
      if (collided.with.has(monster)) {
        dealDamage(health, circle, collided.with.get(damage), ent)
      }
    }
  })
  system({
    pre: function() {
      if (--timeToMonster <= 0) {
        createMonster();
        timeBetweenMonsters -= 10
        timeToMonster = Math.max(timeBetweenMonsters, 50)
      }
    }
  })

  // Global entities
  var playerEnt = entity().add(circle, 600, 152, 20).add(color).add(player)
                          .add(weight, 10).add(follow, mouse, 8).add(health, 500)

  var gameLoop = function() {
    system.all()
    requestAnimationFrame(gameLoop)
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
    entity().add(circle, x, y, radius).add(color, red, green, blue).add(weight, 50)
            .add(follow, playerEnt.get(circle), speed).add(health, 110).add(damage, 8).add(monster)
  }

  function dealDamage(health, circle, damage, ent) {
    health.left -= damage.giving
    if (health.left <= 0) {
      if (ent.has(player)) {
        alert("You died! Refresh the page to replay")
      }
      ent.remove(health)
      if (ent.has(follow)) ent.remove(follow)
      if (ent.has(weight)) ent.remove(weight)
      ent.add(disappering, 30)
      timeBetweenMonsters += 5
    }
    createBloodSplatter(circle)
  }

  function createBloodSplatter(circ) {
    var x = circ.x - circ.radius / 2 + circ.radius * Math.random()
    var y = circ.y - circ.radius / 2 + circ.radius * Math.random()
    entity().add(circle, x, y, circ.radius * Math.random())
            .add(color, 155, 0, 0)
            .add(growing, -0.04)
            .add(disappering, 400)
            .add(background)
  }

  function colorString(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")"
  }

  function handleCollision(ent1, ent2) {
    var pos1 = ent1.get(circle), pos2 = ent2.get(circle)
      , weight1 = ent1.get(weight).val, weight2 = ent2.get(weight).val
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
      if (distribution1 === 1 && distribution2 === 1) return
      pos1.x -= Math.cos(dir) * (overlap * distribution1)
      pos1.y -= Math.sin(dir) * (overlap * distribution1)
      pos2.x += Math.cos(dir) * (overlap * distribution2)
      pos2.y += Math.sin(dir) * (overlap * distribution2)
      ent1.trigger(collided, ent2)
      ent2.trigger(collided, ent1)
    }
  }

})(Kran)
