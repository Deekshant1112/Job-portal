 
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Applicant = sequelize.define('Applicant', {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: DataTypes.STRING,
  resume_url: DataTypes.STRING,
});

module.exports = Applicant;