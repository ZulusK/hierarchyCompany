require("dotenv").config();
process.env.NODE_CONFIG_DIR = __dirname;
const currConfiguration=require("config");

module.exports=currConfiguration;