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

  var c = component({
    growing: "speed",
    goingToExplode: "in",
    damage: "giving",
    weight: "val",
    collided: "with",
    health: "left",
    player: true,
    monster: true,
    explosion: true,
    background: true,
    follow: function (pos, s) {
      this.pos = pos;
      this.speed = s
    },
    pulsing: function(size, speed) {
      this.maxSize = size;
      this.curSize = 0
      this.speed = speed
    },
    disappering: function (t) {
      this.time = t;
      this.curTime = t
    },
    circle: function (x, y, r) {
      this.x = x || 0
      this.y = y || 0
      this.radius = r || 20
    },
    color: function (r, g, b, a) {
      this.r = r || 0; this.g = g || 0; this.b = b || 0; this.a = a || 1;
    }
  })

  // Systems
  system({ // Render
    components: [c.circle, c.color],
    background: [], // Store entities that should be rendered in the background
    pre: function() {
      var ent
      render.clearRect(0, 0, render.canvas.width, render.canvas.height)
      while (this.background.length > 0) {
        ent = this.background.pop()
        if (ent[c.circle] && ent[c.color])
          this.renderCircle(ent[c.circle], ent[c.color])
      }
    },
    every: function(circle, color, ent) {
      if (ent[c.background]) {
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
  },
  { // Resize
    on: ['load', 'resize'],
    pre: function(ev) {
      render.canvas.width = document.body.clientWidth
      render.canvas.height = document.body.clientHeight
    }
  },
  { // Update mouse coordinates
    on: 'mousemove',
    pre: function(ev) {
      mouse.x = ev.clientX
      mouse.y = ev.clientY
    }
  },
  { // Follow mouse
    components: [c.circle, c.follow],
    every: function(circle, follow) {
      var dx = follow.pos.x - circle.x
      var dy = follow.pos.y - circle.y
      var dir = Math.atan2(dy, dx)
      var moveDist = Math.sqrt(Math.min(dx*dx + dy*dy, follow.speed*follow.speed))
      circle.x += Math.cos(dir) * moveDist
      circle.y += Math.sin(dir) * moveDist
    }
  },
  { // Fade out disappering entities
    components: [c.disappering, c.color],
    every: function(dis, color, ent) {
      dis.curTime--
      color.a = dis.curTime / dis.time
      if (dis.curTime <= 0) { ent.delete(); }
    }
  },
  { // Create explosion
    on: "explosion",
    pre: function(ev) {
      entity().add(c.circle, ev.x, ev.y, 10).add(c.color, 255, 80, 0).add(c.damage, 10).add(c.explosion)
              .add(c.disappering, 20).add(c.growing, 5).add(c.weight, Infinity)
      entity().add(c.circle, ev.x, ev.y, 7).add(c.color, 255, 255, 0)
              .add(c.disappering, 20).add(c.growing, 3.5)
      entity().add(c.circle, ev.x, ev.y, 1).add(c.color, 255, 255, 255)
              .add(c.disappering, 20).add(c.growing, 1)
    }
  },
  { // Countdown to and trigger explosion
    components: [c.circle, c.goingToExplode],
    every: function(circle, gointToExplode, ent) {
      gointToExplode.in -= 1
      if (gointToExplode.in <= 0) {
        Kran.trigger("explosion", { x: circle.x, y: circle.y } )
        ent.delete()
      }
    }
  },
  { // Grow circle
    components: [c.circle, c.growing],
    every: function(circle, growing, ent) {
      circle.radius += growing.speed
    }
  },
  { // Place bomb
    on: "mousedown",
    pre: function(ev) {
      entity().add(c.circle, ev.clientX, ev.clientY, 10).add(c.color, 100, 0, 0)
                  .add(c.goingToExplode, 100).add(c.pulsing, 3, 0.15)
                  .add(c.weight, 100)
    }
  },
  { // Change size of pulsing circles
    components: [c.circle, c.pulsing],
    every: function(circle, pulsing) {
      circle.radius += pulsing.speed
      pulsing.curSize += pulsing.speed
      if (pulsing.curSize >= pulsing.maxSize) {
        circle.radius -= pulsing.curSize
        pulsing.curSize = 0
      }
    }
  },
  { // Detect collisions
    components: [c.circle, c.weight],
    pre: function() {
      Kran.getEntities([c.circle, c.weight]).forEach(function (ent1, elm) {
        var ent2
        while((elm = elm.next) && (ent2 = elm.data)) {
          if (!ent1[c.weight]) break;
          handleCollision(ent1, ent2)
        }
      }, this)
    }
  },
  { // Makes explosions deal damage
    components: [c.collided, c.circle, c.health],
    arrival: function(collided, circle, h, ent) {
      if (collided.with[c.explosion]) {
        dealDamage(h, circle, collided.with[c.damage], ent)
      }
    }
  },
  { // Makes the player take damage from monsters
    components: [c.collided, c.circle, c.health, c.player],
    arrival: function(collided, circle, health, player, ent) {
      if (collided.with[c.monster]) {
        dealDamage(health, circle, collided.with[c.damage], ent)
      }
    }
  })

  // Global entities
  var playerEnt = entity().add(c.circle, 600, 152, 20).add(c.color).add(c.player)
                 .add(c.weight, 10).add(c.follow, mouse, 8).add(c.health, 500)

  var gameLoop = function() {
    system.all()
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
    entity().add(c.circle, x, y, radius).add(c.color, red, green, blue).add(c.weight, 50)
            .add(c.follow, playerEnt[c.circle], speed).add(c.health, 110).add(c.damage, 8).add(c.monster)
  }

  function dealDamage(h, circle, damage, ent) {
    h.left -= damage.giving
    if (h.left <= 0) {
      if (ent[c.player]) {
        alert("You died! Refresh the page to replay")
      }
      ent.remove(c.health)
      if (ent[c.follow]) ent.remove(c.follow)
      if (ent[c.weight]) ent.remove(c.weight)
      ent.add(c.disappering, 30)
      timeBetweenMonsters += 5
    }
    bloodSplatter(circle)
  }

  function bloodSplatter(circ) {
    var x = circ.x - circ.radius / 2 + circ.radius * Math.random()
    var y = circ.y - circ.radius / 2 + circ.radius * Math.random()
    entity().add(c.circle, x, y, circ.radius * Math.random())
            .add(c.color, 155, 0, 0)
            .add(c.growing, -0.04)
            .add(c.disappering, 400)
            .add(c.background)
  }

  function colorString(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")"
  }

  function handleCollision(ent1, ent2) {
    var pos1 = ent1[c.circle], pos2 = ent2[c.circle]
      , weight1 = ent1[c.weight].val, weight2 = ent2[c.weight].val
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
      ent1.trigger(c.collided, ent2)
      ent2.trigger(c.collided, ent1)
    }
  }

})(Kran)
