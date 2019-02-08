const express = require('express');
const router = express.Router();

/* GET parse listing. */
router.get('/', function(req, res, next) {

  res.send('Hello from parse');

});

module.exports = router;
