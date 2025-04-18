const Applicant = require('../models/Applicant');
const Application = require('../models/Application');
const Job = require('../models/Job');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const SelectedCandidate = require('../models/SelectedCandidate');
const Employer = require('../models/Employer');

const ScheduledInterview = require('../models/ScheduledInterview');


exports.addEmployer = async (req, res) => {
    try {
      const { name, department, official_email } = req.body;
  
      await Employer.create({ name, department, official_email });
  
      res.redirect('/applications/scheduled-interviews'); // or anywhere else you prefer
    } catch (error) {
      console.error('Error adding employer:', error.message);
      res.status(500).send('Failed to add employer');
    }
  };



  exports.applyJob = async (req, res) => {
    try {
      const { first_name, last_name, email, phone, cover_letter } = req.body;
      
      // Check if file was uploaded
      const resume_url = req.file ? req.file.location : null; // S3 URL is in `req.file.location`
  
      let applicant = await Applicant.findOne({ where: { email } });
      if (!applicant) {
        // Create new applicant if not found
        applicant = await Applicant.create({
          first_name,
          last_name,
          email,
          phone,
          resume_url,
        });
      } else {
        // Update applicant with the new resume URL
        await applicant.update({ resume_url });
      }
  
      // Create application entry
      await Application.create({
        job_id: req.params.id,
        applicant_id: applicant.id,
        cover_letter,
      });
  
      // Render success page after application
      res.render('applications/success');
    } catch (error) {
      console.error('Apply job error:', error);
      res.status(500).send('Server Error');
    }
  };
  

exports.getApplications = async (req, res) => {
    try {
        const applications = await Application.findAll({
            include: [
                { model: Job, attributes: ['title'], required: false },
                { model: Applicant, attributes: ['first_name', 'last_name', 'email', 'phone', 'resume_url'], required: false },
            ],
        });
        res.render('applications/index', { applications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).send('Server Error');
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status value: ${status}` });
        }

        const application = await Application.findByPk(req.params.id, {
            include: [
                { model: Job, attributes: ['id', 'title'] },
                { model: Applicant },
            ],
        });

        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        await application.update({ status });

        // If accepted, store in SelectedCandidates table
        if (status === 'accepted') {
            const exists = await SelectedCandidate.findOne({
                where: {
                    applicant_id: application.Applicant.id,
                    job_id: application.Job.id,
                },
            });

            

            if (!exists) {
                await SelectedCandidate.create({
                    job_id: application.Job.id,
                    applicant_id: application.Applicant.id,
                    full_name: `${application.Applicant.first_name} ${application.Applicant.last_name}`,
                    email: application.Applicant.email,
                    phone: application.Applicant.phone,
                    resume_url: application.Applicant.resume_url,
                    job_title: application.Job.title,
                });
            }
        }

        res.json({ success: true, status });
    } catch (error) {
        console.error('Update status error:', error.message);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

exports.getSelectedCandidates = async (req, res) => {
    try {
      const selected = await SelectedCandidate.findAll({
        include: [{ model: Employer }],
      });
  
      const employers = await Employer.findAll();
  
      res.render('candidates/selected', { selected, employers });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).send('Server Error');
    }
  };
  

exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id, {
            include: [{ model: Applicant, attributes: ['resume_url'] }],
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        if (application.Applicant && application.Applicant.resume_url) {
            const resumePath = path.join(__dirname, '../public', application.Applicant.resume_url);
            try {
                await fs.unlink(resumePath);
            } catch (err) {
                console.warn('Resume file not found:', resumePath);
            }
        }
        await application.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};


exports.sendEmail = async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id, {
            include: [
                { model: Applicant, attributes: ['first_name', 'last_name', 'email'] },
                { model: Job, attributes: ['title'] },
            ],
        });

        if (!application) {
            console.warn(`Application not found: ID ${req.params.id}`);
            return res.status(404).json({ error: 'Application not found' });
        }

        if (application.status !== 'accepted') {
            console.warn(`Cannot send email for application ${req.params.id}: Status is ${application.status}`);
            return res.status(400).json({ error: 'Email can only be sent for accepted applications' });
        }

        if (!application.Applicant || !application.Applicant.email) {
            console.warn(`No email found for application ${req.params.id}`);
            return res.status(400).json({ error: 'Applicant email not found' });
        }

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Auto-generated email template
        const mailOptions = {
            from: `"Job Portal" <${process.env.EMAIL_USER}>`,
            to: application.Applicant.email,
            subject: 'Congratulations! Your Application Has Been Accepted',
            html: `
          <h2>Congratulations, ${application.Applicant.first_name} ${application.Applicant.last_name}!</h2>
          <p>We are pleased to inform you that your application for the position of <strong>${application.Job ? application.Job.title : 'N/A'}</strong> has been accepted.</p>
          <p>Our team will reach out soon with next steps. Thank you for applying!</p>
          <p>Best regards,<br>Job Portal Team</p>
        `,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${application.Applicant.email} for application ${req.params.id}`);

        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error(`Error sending email for application ${req.params.id}:`, error.message);
        res.status(500).json({ error: 'Failed to send email' });
    }
};




// controller method
exports.scheduleInterview = async (req, res) => {
    try {
      const selectedCandidateId = parseInt(req.params.id);
      if (isNaN(selectedCandidateId)) {
        return res.status(400).json({ error: 'Invalid candidate ID in URL' });
      }
  
      const employerId = parseInt(req.body.interviewer_id); // updated key
      if (isNaN(employerId)) {
        return res.status(400).json({ error: 'Invalid interviewer ID in form' });
      }
  
      const { interview_date, interview_time, department } = req.body;
  
      const selectedCandidate = await SelectedCandidate.findByPk(selectedCandidateId);
      const employer = await Employer.findByPk(employerId);
  
      if (!selectedCandidate) {
        return res.status(404).json({ error: 'Selected Candidate not found' });
      }
  
      if (!employer) {
        return res.status(404).json({ error: 'Employer not found' });
      }
  
      const scheduledInterviews = await ScheduledInterview.create({
        selected_candidate_id: selectedCandidateId,
        employer_id: employerId,
        interview_date,
        interview_time,
        
        department,
        status: 'scheduled',
      });
  
      // Send email to employer
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      await transporter.sendMail({
        from: `"Job Portal" <${process.env.EMAIL_USER}>`,
        to: employer.official_email,
        subject: 'Interview Scheduled',
        html: `
          <p>Hello ${employer.name},</p>
          <p>An interview has been scheduled with the following details:</p>
          <ul>
            <li>Candidate: ${selectedCandidate.full_name}</li>
            <li>Job Title: ${selectedCandidate.job_title}</li>
            <li>Date: ${interview_date}</li>
            <li>Time: ${interview_time}</li>
            <li>Department: ${department}</li>
          </ul>
          <p>Please be available at the scheduled time.</p>
        `,
      });
  
      res.redirect('/applications/scheduled-interviews');
    } catch (error) {
      console.error('Error scheduling interview:', error.message);
      res.status(500).json({ error: 'Failed to schedule interview' });
    }
  };
  
  
  exports.getScheduledInterviews = async (req, res) => {
    try {
      const scheduledInterviews = await ScheduledInterview.findAll({
        include: [
          {
            model: SelectedCandidate,
            attributes: ['full_name', 'job_title', 'email'],
          },
          {
            model: Employer,
            attributes: ['name', 'department', 'official_email'],
          },
        ],
      });
  
      res.render('scheduledInterviews/index', { scheduledInterviews });
    } catch (error) {
      console.error('Error fetching scheduled interviews:', error.message);
      res.status(500).send('Server Error');
    }
  };



  exports.updateInterviewStatus = async (req, res) => {
    try {
      const { id } = req.params;  // Interview ID
      const { status } = req.body;  // New status value
  
      // Update the status in the ScheduledInterview table
      await ScheduledInterview.update({ status }, { where: { id } });
  
      // Redirect to the scheduled interviews page
      res.redirect('/applications/scheduled-interviews');
    } catch (err) {
      console.error('Error updating status:', err.message);
      res.status(500).send('Server error');
    }
  };
  
  exports.setInterviewResult = async (req, res) => {
    try {
      const { id } = req.params; // Interview ID
      const { result } = req.body; // Result from the button (Passed or Failed)
  
      if (result === 'Passed') {
        // Update the status to 'Passed' in the database
        await ScheduledInterview.update({ status: 'Passed' }, { where: { id } });
      } else if (result === 'Failed') {
        // Delete the interview record if failed
        await ScheduledInterview.destroy({ where: { id } });
      }
  
      // Redirect to scheduled interviews page after updating
      res.redirect('/applications/scheduled-interviews');
    } catch (err) {
      console.error('Error setting result:', err.message);
      res.status(500).send('Server error');
    }
  };
  
  
