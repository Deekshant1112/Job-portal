// models/SelectedCandidate.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./Job');
const Applicant = require('./Applicant');
const Employer = require('./Employer');

const SelectedCandidate = sequelize.define('SelectedCandidate', {
  job_id: DataTypes.INTEGER,
  applicant_id: DataTypes.INTEGER,
  full_name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  resume_url: DataTypes.STRING,
  job_title: DataTypes.STRING,
  selection_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  interview_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  interviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Associations
SelectedCandidate.belongsTo(Job, { foreignKey: 'job_id' });
SelectedCandidate.belongsTo(Applicant, { foreignKey: 'applicant_id' });
SelectedCandidate.belongsTo(Employer, { foreignKey: 'interviewer_id' }); // 👈 NEW

module.exports = SelectedCandidate;
