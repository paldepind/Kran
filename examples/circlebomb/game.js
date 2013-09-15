(function () {
  var component = Kran.component
  var system = Kran.system
  var entity = Kran.entity

  // Globals
  var render = document.getElementById('render').getContext('2d')
  var mouse = { x: 0, y: 0 }

  // Components
  var circle = component(function (x, y, r) {
    this.x = x || 0
    this.y = y || 0
    this.radius = r || 20
  })

  var color = component(function (r, g, b, a) {
    this.r = r || 0; this.g = g || 0; this.b = b || 0; this.a = a || 1;
  })

  var goingToExplode = component("in")

  var disappering = component(function (t) { this.time = t; this.curTime = t })

  var growing = component(function (s) { this.speed = s })

  var follow = component(function (pos, s) {
    this.pos = pos;
    this.speed = s
  })

  var pulsing = component(function (size, speed) {
    this.maxSize = size;
    this.curSize = 0
    this.speed = speed
  })

  var damage = component("giving")
  var weight = component("val")
  var collided = component("with")
  var health = component("left")
  var player = component()
  var monster = component()
  var explosion = component()

  // Systems
  system({ // Render
    components: [circle, color],
    pre: function() {
      render.clearRect(0, 0, render.canvas.width, render.canvas.height)
    },
    every: function(circle, color) {
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
      mouse.x = ev.x
      mouse.y = ev.y
    }
  },
  { // Follow mouse
    components: [circle, follow],
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
    components: [disappering, color],
    every: function(dis, color, ent) {
      dis.curTime--
      color.a = dis.curTime / dis.time
      if (dis.curTime <= 0) { ent.delete(); }
    }
  },
  { // Create explosion
    on: "explosion",
    pre: function(ev) {
      entity().add(circle, ev.x, ev.y, 10).add(color, 255, 80, 0).add(damage, 10).add(explosion)
              .add(disappering, 20).add(growing, 5).add(weight, Infinity)
      entity().add(circle, ev.x, ev.y, 7).add(color, 255, 255, 0)
              .add(disappering, 20).add(growing, 3.5)
      entity().add(circle, ev.x, ev.y, 1).add(color, 255, 255, 255)
              .add(disappering, 20).add(growing, 1)
    }
  },
  { // Countdown to and trigger explosion
    components: [circle, goingToExplode],
    every: function(circle, gointToExplode, ent) {
      gointToExplode.in -= 1
      if (gointToExplode.in <= 0) {
        Kran.trigger("explosion", { x: circle.x, y: circle.y } )
        ent.delete()
      }
    }
  },
  { // Grow circle
    components: [circle, growing],
    every: function(circle, growing, ent) {
      circle.radius += growing.speed
      if (circle.radius < 0) ent.delete()
    }
  },
  { // Place bomb
    on: "mousedown",
    pre: function(ev) {
      entity().add(circle, ev.x, ev.y, 10).add(color, 100, 0, 0)
                  .add(goingToExplode, 100).add(pulsing, 3, 0.15)
                  .add(weight, 100)
    }
  },
  { // Change size of pulsing circles
    components: [circle, pulsing],
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
  },
  { // Make explosions deal damage
    components: [collided, circle, health],
    arrival: function(collided, circle, h, ent) {
      if (collided.with[explosion]) {
    console.log(damage)
        dealDamage(h, circle, collided.with[damage], ent)
      }
    }
  },
  {
    components: [collided, circle, health, player],
    arrival: function(collided, circle, h, player, ent) {
      if (collided.with[monster]) {
        dealDamage(h, circle, collided.with[damage], ent)
      }
    }
  })

  // Game globals

  var playerEnt = entity().add(circle, 600, 152, 20).add(color).add(player)
              .add(weight, 10).add(follow, mouse, 8).add(health, 500)
  var timeToMonster = 200;
  var timeBetweenMonsters = 200

  var gameLoop = function() {
    system.all()
    requestAnimationFrame(gameLoop)
    if (--timeToMonster <= 0) {
      createMonster();
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
    entity().add(circle, x, y, radius).add(color, red, green, blue).add(weight, 50)
            .add(follow, playerEnt[circle], speed).add(health, 110).add(damage, 4).add(monster)
  }

  function dealDamage(h, circle, damage, ent) {
    h.left -= damage.giving
    if (h.left <= 0) {
      ent.remove(health)
      if (ent[follow]) ent.remove(follow)
      if (ent[weight]) ent.remove(weight)
      ent.add(disappering, 30)
      timeBetweenMonsters -= 5
    }
    bloodSplatter(circle)
  }

  function bloodSplatter(c) {
    var x = c.x - c.radius / 2 + c.radius * Math.random()
    var y = c.y - c.radius / 2 + c.radius * Math.random()
    entity().add(circle, x, y, c.radius * Math.random())
            .add(color, 155, 0, 0)
            .add(growing, -0.04)
            .add(disappering, 400)
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
