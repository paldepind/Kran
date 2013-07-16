var chai = require("chai")

var sinonChai = require("sinon-chai")
chai.use(sinonChai)

global.chai = chai
global.should = chai.should()
