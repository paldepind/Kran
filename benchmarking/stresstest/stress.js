(function () {
  var c = Kran.component
  var s = Kran.system
  var e = Kran.entity

  // Globals
  var render = document.getElementById('render').getContext('2d')
  render.font = "0.8em sans-serif"
  var squares = 0
  var entities = 0
  
  // Constants
  var CW = 800
  var CH = 600

  var COLORS = [
    "rgb(241, 196, 15)",
    "rgb(142, 68, 173)",
    "rgb(243, 156, 18)",
    "rgb(22, 160, 133)",
    "rgb(39, 174, 96)",
    "rgb(44, 62, 80)",
    "rgb(52, 152, 219)",
    "rgb(192, 57, 43)"
  ]

  // Components
 
  var lives = c("left")
  var bounced = c()
  var color = c("string")

  var velocity = c(function (x, y) {
    this.x = x || 1
    this.y = y || 1
  })

  var square = c(function (x, y, w, h) {
    this.x = x || 0
    this.y = y || 0
    this.w = w || 10
    this.h = h || 10
  })

  // Create a bunch of components
  var weight = c("val")
  var turning = c("angle")
  var sine = c("time")
  var repulsive = c("ness")
  var growing = c(function (x, y) {
    this.x = x
    this.y = y
  })
  var accelerate = c(function (x, y) {
    this.x = x
    this.y = y
  })
  var pulsing = c(function (amount) {
    this.maxAmount = amount
    this.curAmount = amount
  }

  // Systems
  
  s({ // Render squares
    components: [square, color],
    pre: function() {
      render.clearRect(0, 0, render.canvas.width, render.canvas.height)
    },
    every: function(square, color) {
      render.fillStyle = color.string
      render.fillRect(square.x, square.y, square.w, square.h)
    }
  })

  s({
    components: [velocity, square],
    every: function(velocity, square) {
      square.x += velocity.x
      square.y += velocity.y
    }
  })

  s({ // Bounce
    components: [velocity, square],
    every: function(velocity, square, ent) {
      if (square.x + square.w > CW ||
          square.x < 0) {
        velocity.x = -velocity.x
        square.x = Math.max(0, square.x)
        square.x = Math.min(CW, square.x)
        ent.trigger(bounced)
      } else if (square.y + square.h > CH ||
                 square.y < 0) {
        velocity.y = -velocity.y
        square.y = Math.max(0, square.y)
        square.y = Math.min(CH, square.y)
        ent.trigger(bounced)
      }
    }
  })

  s({
    components: [bounced, lives],
    arrival: function(bounced, lives, ent) {
      --lives.left
     if (lives.left === 0) {
       squares--
       ent.delete()
     }
    }
  })

  s({ // Calculate and render FPS. Adjust amount of squares
    last: 0,
    fpses: new Array(60),
    fpsIndex: 0,
    pre: function() {
      var delta, fps, cur = window.performance.now()
      if (this.last) {
        delta = cur - this.last
        fps = (1000 / delta) | 0
        this.fpses[this.fpsIndex] = fps
        this.fpsIndex = (this.fpsIndex + 1) % 60
        fps = this.fpses.reduce(function(a,b){return a+b}) / 60 | 0
        render.clearRect(0, 0, 110, 70)
        render.fillStyle = "rgb(0, 0, 0)"
        render.fillText("FPS: " + fps, 10, 20)
        render.fillText("Entities: " + entities, 10, 40)
        render.fillText("Squares: " + squares, 10, 60)
      }
      this.last = cur
      // Create new squares
      for (var i = 55; i < fps; i++) {
        createSquare()
        ++squares
      }
    }
  })

  s({
    components: [repulsive, square],
    loop: undefined,
    every: function(repulsive, square, ent) {
      if (this.loop) {
        this.loop.forEach(function (ent2) {

        })
      } else {
        this.loop = Kran.getEntities(square)
      }
    }
  })

  var gameLoop = function() {
    s.all()
    requestAnimationFrame(gameLoop)
  }
  gameLoop()

  // Helper functions

  function createSquare() {
    var vy = 10 * Math.random()
    var vx = 10 * Math.random()
    var sizex = 10 + 20 * Math.random()
    var sizey = 10 + 20 * Math.random()
    var col = COLORS[8 * Math.random() | 0]
    e().add(square, 0, 0, sizex, sizey)
       .add(velocity, vx, vy)
       .add(lives, 10)
       .add(color, col)
  }

  function handleCollision(ent1, ent2) {
  }

})(Kran)
