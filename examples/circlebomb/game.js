(function () {
  var component = Kran.component
  var system = Kran.system
  var entity = Kran.entity

  // Components
  var render = component.new(
    document.getElementById('render').getContext('2d')
  )

  var circle = component.new(function (x, y, r) {
    this.x = x || 0
    this.y = y || 0
    this.radius = r || 20
  })

  var followMouse = component.new(true)

  // Systems
  system.new({
    components: [render, circle],
    pre: function() {
      var r = component[render]
      r.clearRect(0, 0, r.canvas.width, r.canvas.height)
    },
    every: function(render, circle) {
      render.arc(circle.x, circle.y, circle.radius, 0, Math.PI*2, false)
      render.fill()
    }
  })

  system.new({
    on: ['load', 'resize'],
    pre: function(ev) {
      var r = component[render]
      r.canvas.width = document.body.clientWidth
      r.canvas.height = document.body.clientHeight
    }
  })

  system.new({
    on: 'mousemove',
    components: [circle, followMouse],
    every: function(ev, circle, followMouse) {
      circle.x = ev.x
      circle.y = ev.y
    }
  })

  var ent = entity.new().add(render).add(circle, 100, 152, 50).add(followMouse)

  var gameLoop = function() {
    system.all.run()
    requestAnimationFrame(gameLoop)
  }
  gameLoop()

})(Kran)
