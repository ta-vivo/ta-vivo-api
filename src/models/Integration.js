import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

const Integration = sequelize.define('integrations', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.ENUM('telegram', 'email', 'slack', 'discord'),
  },
  appUserId: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  // To store extra data like discord webhook token
  data: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {});

Integration.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Integration);

export default Integration;