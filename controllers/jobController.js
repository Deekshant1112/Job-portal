const Job = require('../models/Job');
const Application = require('../models/Application');
const Applicant = require('../models/Applicant');

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({ where: { status: 'open' } });
    res.render('jobs/index', { jobs });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

exports.getCreateJob = (req, res) => {
  res.render('jobs/create');
};

exports.createJob = async (req, res) => {
  try {
    await Job.create(req.body);
    res.redirect('/jobs');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

exports.getJobDetails = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).send('Job not found');
    res.render('jobs/details', { job });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).send('Job not found');
    const applications = await Application.findAll({
      where: { job_id: req.params.id },
      include: [
        { model: Applicant, attributes: ['first_name', 'last_name', 'email', 'phone', 'resume_url'] },
      ],
    });
    res.render('applications/index', { applications, jobTitle: job.title });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};