import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

const Checks = sequelize.define('checks', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  },
  target: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  periodToCheck: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  periodToCheckLabel: {
    type: Sequelize.STRING,
    allowNull: false
  },
  retryOnFail: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  onFailPeriodToCheck: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  onFailPeriodToCheckLabel: {
    type: Sequelize.STRING,
    allowNull: true
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },

}, {});

Checks.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Checks);

export default Checks;