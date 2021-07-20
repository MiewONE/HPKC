// const { MongoClient } = require("mongodb");
// require("dotenv").config();
// const url = "mongodb://localhost:27017";
//
// const client = new MongoClient(url, {
//     userNewUrlParser: true,
//     useUnifiedTopology: true,
// });

require("dotenv").config();
const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://miewone:${process.env.mongodbpw}@cluster0.e5ipp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = client;
