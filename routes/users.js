const express = require('express');
const router = express.Router();
const fs = require('fs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/asd', function(req, res, next) {
  res.send('respond with a re11source');
});

module.exports = router;
