"use strict";

global.sinon = require("sinon");
global.chai = require("chai");
global.should = global.chai.should();

var sinonChai = require("sinon-chai");
global.chai.use(sinonChai);
