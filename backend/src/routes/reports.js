const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');

router.post('/', authenticate, reportController.createReport);

module.exports = router;
