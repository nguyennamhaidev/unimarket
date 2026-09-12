const express = require('express');
const router = express.Router();
const catUniController = require('../controllers/categoryUniversityController');

router.get('/categories', catUniController.getCategories);
router.get('/universities', catUniController.getUniversities);
router.get('/locations', catUniController.getLocations);

module.exports = router;
