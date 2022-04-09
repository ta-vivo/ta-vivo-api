import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

const UserSubscription = sequelize.define('users_subscriptions', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: Sequelize.ENUM('paypal', 'stripe'),
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  // To store extra data like "subscriptionId" for paypal
  data: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {});

UserSubscription.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(UserSubscription);

export default UserSubscription;