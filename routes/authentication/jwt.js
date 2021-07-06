const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const dbClient = require("../db/db");
const express = require("express");
const router = express.Router();

dotenv.config();

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.ACCESSTOKEN, {
        expiresln: "20m",
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESHTOKEN, {
        expiresln: "300m",
    });
};
async function dbCollection() {
    const client = await _client;
    return client.db("oauthUser").collection("users");
}
