const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const upload = require('../middleware/upload');


router.post('/:id/apply', upload.single('resume'), applicationController.applyJob);
router.get('/', applicationController.getApplications);

router.post('/:id/status', (req, res, next) => {
  console.log(`Received POST to /applications/${req.params.id}/status with body:`, req.body);
  applicationController.updateStatus(req, res, next);
});
router.delete('/:id', applicationController.deleteApplication);

router.post('/:id/send-email', (req, res, next) => {
    console.log(`Received POST to /applications/${req.params.id}/send-email`);
    applicationController.sendEmail(req, res, next);
  });

  router.get('/selected', applicationController.getSelectedCandidates);
  router.post('/selected/:id/schedule-interview', applicationController.scheduleInterview);

  router.get('/scheduled-interviews', applicationController.getScheduledInterviews);

  router.post('/employers/add', applicationController.addEmployer);
// Route to update interview status (Scheduled, Done, Pending)
router.post('/interviews/:id/update-status', applicationController.updateInterviewStatus);

// Route to update the result of the interview (Pass or Fail)
router.post('/interviews/:id/result', applicationController.setInterviewResult);





module.exports = router;