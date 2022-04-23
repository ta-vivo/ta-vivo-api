import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

/**
 * This model use to store pending email confirmation in integrations, register, and password reset
 */
const PendingEmailConfirmation = sequelize.define('pending_email_confirmation', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uniqueCode: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {});

PendingEmailConfirmation.belongsTo(User);
User.hasOne(PendingEmailConfirmation);

export default PendingEmailConfirmation;