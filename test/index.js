require("module-alias/register");

//config chai
const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiPromised = require("chai-as-promised");
chai.use(chaiHttp);
chai.use(chaiPromised);
//run server
require("@server");
//Include tests
require("./user");