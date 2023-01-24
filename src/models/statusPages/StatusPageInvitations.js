import Sequelize from 'sequelize';
import { sequelize } from '../../database/database';
import { StatusPages } from '../index';

const StatusPageInvitations = sequelize.define('status_page_invitations', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  method: {
    type: Sequelize.STRING,
    allowNull: false
  },
  data: {
    type: Sequelize.JSONB,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {});

StatusPageInvitations.belongsTo(StatusPages, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
StatusPages.hasMany(StatusPageInvitations);

export default StatusPageInvitations;