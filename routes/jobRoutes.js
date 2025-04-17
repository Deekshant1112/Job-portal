const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

router.get('/', jobController.getJobs);
router.get('/create', jobController.getCreateJob);
router.post('/create', jobController.createJob);
router.get('/:id', jobController.getJobDetails);
router.get('/:id/applications', jobController.getJobApplications); // New route

module.exports = router;