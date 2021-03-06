import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { Checks } from './index';

const CheckLogs = sequelize.define('check_logs', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: Sequelize.ENUM('up', 'down'),
  },
  duration: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  timezone: {
    type: Sequelize.TEXT,
    allowNull: false,
    defaultValue: 'UTC'
  }
}, {});

CheckLogs.belongsTo(Checks);
Checks.hasMany(CheckLogs);

export default CheckLogs;