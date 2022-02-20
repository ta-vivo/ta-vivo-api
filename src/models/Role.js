import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { User } from './index';

const Role = sequelize.define('roles', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  }
}, {});

Role.hasMany(User);
User.belongsTo(Role);

export default Role;