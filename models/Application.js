const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./Job');
const Applicant = require('./Applicant');

const Application = sequelize.define('Application', {
  cover_letter: DataTypes.TEXT,
  application_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'accepted', 'rejected'),
    // defaultValue: 'pending',
   defaultValue : 'pending'
  },
});

// Define relationships
Job.hasMany(Application, { foreignKey: 'job_id' });
Applicant.hasMany(Application, { foreignKey: 'applicant_id' });
Application.belongsTo(Job, { foreignKey: 'job_id' });
Application.belongsTo(Applicant, { foreignKey: 'applicant_id' });

module.exports = Application;