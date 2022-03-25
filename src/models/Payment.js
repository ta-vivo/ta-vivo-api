import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

const Payment = sequelize.define('payments', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: Sequelize.ENUM('paypal', 'stripe'),
  },
  // To store extra data like "subscriptionId" for paypal
  data: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {});

Payment.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Payment);

export default Payment;