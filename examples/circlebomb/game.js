(function () {
  var component = Kran.component
  var system = Kran.system
  var entity = Kran.entity

  // Globals
  var render = document.getElementById('render').getContext('2d')
  var mouse = { x: 0, y: 0 }

  // Components
  var circle = component.new(function (x, y, r) {
    this.x = x || 0
    this.y = y || 0
    this.radius = r || 20
  })

  var color = component.new(function (r, g, b, a) {
    this.r = r || 0; this.g = g || 0; this.b = b || 0; this.a = a || 1;
  })

  var goingToExplodeIn = component.new()

  var disappering = component.new(function (t) { this.time = t; this.curTime = t })

  var growing = component.new(function (s) { this.speed = s })

  var followMouse = component.new(function (s) { this.speed = s })

  var pulsing = component.new(function (size, speed) {
    this.maxSize = size;
    this.curSize = 0
    this.speed = speed
  })

  var weight = component.new()

  // Systems
  system.new({ // Render
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
  })

  system.new({ // Resize
    on: ['load', 'resize'],
    pre: function(ev) {
      render.canvas.width = document.body.clientWidth
      render.canvas.height = document.body.clientHeight
    }
  })

  system.new({ // Update mouse coordinates
    on: 'mousemove',
    pre: function(ev) {
      mouse.x = ev.x
      mouse.y = ev.y
    }
  })

  system.new({ // Follow mouse
    components: [circle, followMouse],
    every: function(circle, followMouse) {
      var dx = mouse.x - circle.x
      var dy = mouse.y - circle.y
      var dir = Math.atan2(dy, dx)
      var moveDist = Math.sqrt(Math.min(dx*dx + dy*dy, followMouse.speed*followMouse.speed))
      circle.x += Math.cos(dir) * moveDist
      circle.y += Math.sin(dir) * moveDist
    }
  })

  system.new({ // Fade out disappering entities
    components: [disappering, color],
    every: function(dis, color, ent) {
      dis.curTime--
      color.a = dis.curTime / dis.time
      if (dis.curTime <= 0) { ent.delete(); }
    }
  })

  system.new({
    on: "explosion",
    pre: function(ev) {
      entity.new().add(circle, ev.x, ev.y, 10).add(color, 255, 80, 0)
                  .add(disappering, 20).add(growing, 5).add(weight, Infinity)
      entity.new().add(circle, ev.x, ev.y, 7).add(color, 255, 255, 0)
                  .add(disappering, 20).add(growing, 3.5)
      entity.new().add(circle, ev.x, ev.y, 1).add(color, 255, 255, 255)
                  .add(disappering, 20).add(growing, 1)
    }
  })

  system.new({
    components: [circle, goingToExplodeIn],
    every: function(circle, time, ent) {
      time.val--
      if (time.val <= 0) {
        Kran.trigger("explosion", { x: circle.x, y: circle.y } )
        ent.delete()
      }
    }
  })

  system.new({
    components: [circle, growing],
    every: function(circle, growing) {
      circle.radius += growing.speed
    }
  })

  system.new({ // Place bomb
    on: "click",
    pre: function(ev) {
      entity.new().add(circle, ev.x, ev.y, 10).add(color, 100, 0, 0)
                  .add(goingToExplodeIn, 100).add(pulsing, 3, 0.15)
                  .add(weight, 100)
    }
  })

  system.new({
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

  system.new({ // Detect collisions
    components: [circle, weight],
    pre: function() {
      this.entities.forEach(function (ent1, elm) {
        var ent2
        while((elm = elm.next) && (ent2 = elm.data)) {
          handleCollision(ent1[circle], ent1[weight].val,
                          ent2[circle], ent2[weight].val)
        }
      }, this)
    }
  })

  entity.new().add(circle, 80, 152, 60).add(color).add(weight, 60).add(followMouse, 1)
  entity.new().add(circle, 250, 152, 50).add(color).add(weight, 50).add(followMouse, 2)
  entity.new().add(circle, 400, 152, 40).add(color).add(weight, 40).add(followMouse, 3)
  entity.new().add(circle, 500, 152, 20).add(color).add(weight, 20).add(followMouse, 4)
  entity.new().add(circle, 600, 152, 10).add(color).add(weight, 10).add(followMouse, 5)

  var gameLoop = function() {
    system.all.run()
    requestAnimationFrame(gameLoop)
  }
  gameLoop()

  // Helper functions  
  function colorString(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")"
  }

  function handleCollision(circle1, weight1, circle2, weight2) {
    var dir, distribution1, distribution2
    var dx = circle2.x - circle1.x
    var dy = circle2.y - circle1.y
    var overlap = circle1.radius + circle2.radius - Math.sqrt(dx*dx+dy*dy)
    if (overlap > 0) {
      dir = Math.atan2(dy, dx)
      totalWeight = weight2 + weight1
      distribution1 = weight2 / totalWeight
      if (isNaN(distribution1)) distribution1 = 1
      distribution2 = weight1 / totalWeight
      if (isNaN(distribution2)) distribution2 = 1
      circle1.x -= Math.cos(dir) * (overlap * distribution1)
      circle1.y -= Math.sin(dir) * (overlap * distribution1)
      circle2.x += Math.cos(dir) * (overlap * distribution2)
      circle2.y += Math.sin(dir) * (overlap * distribution2)
    }
  }

})(Kran)
