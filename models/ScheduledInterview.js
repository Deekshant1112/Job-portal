// models/ScheduledInterview.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SelectedCandidate = require('./SelectedCandidate');
const Employer = require('./Employer');

const ScheduledInterview = sequelize.define('ScheduledInterview', {
  selected_candidate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  employer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  interview_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  interview_time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },

status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending', // 'Pending' or 'Done'
  },
  result: {
    type: DataTypes.STRING, // 'Passed' or 'Failed'
    allowNull: true,
  },
  
});

// Associations
ScheduledInterview.belongsTo(SelectedCandidate, { foreignKey: 'selected_candidate_id' });
ScheduledInterview.belongsTo(Employer, { foreignKey: 'employer_id' });

module.exports = ScheduledInterview;
