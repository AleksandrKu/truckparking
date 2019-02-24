'use strict';
const express = require('express');
const router = express.Router();
const parseController = require('../controllers/parseController');

/* GET parse listing. */
router.get('/', parseController.result);
module.exports = router;
