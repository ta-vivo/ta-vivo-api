import Sequelize from 'sequelize';
import { sequelize } from '../../database/database';
import { User } from '../index';

const StatusPages = sequelize.define('status_pages', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true
  },
  uuid: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  isPublic: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: true
  }
}, {});

StatusPages.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(StatusPages);

export default StatusPages;