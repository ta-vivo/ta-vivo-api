import Sequelize from 'sequelize';
import { sequelize } from '../database/database';

const User = sequelize.define('users', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: Sequelize.TEXT,
    allowNull: false,
    unique: true
  },
  fullname: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  // To check if user account is enabled or disabled to avoid login
  enabled: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  // For confirm email
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
}, {});

export default User;