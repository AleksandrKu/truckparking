'use strict';

const express = require('express');
const router = express.Router();
const  { downloadFile } = require('../controllers/downloadController.js');
const  { index } = require('../controllers/indexController.js');

/* GET home page. */
router.get('/', index);
router.get('/download',  downloadFile );

module.exports = router;
