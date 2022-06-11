import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './';

const UserCredential = sequelize.define('users_credentials', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'local'
  }
}, {});

UserCredential.belongsTo(User);
User.hasMany(UserCredential);

export default UserCredential;