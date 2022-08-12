import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { Checks } from './index';

const CheckAuthorization = sequelize.define('check_authorizations', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  headerName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  encryptedToken: {
    type: Sequelize.JSONB,
    allowNull: false
  },
}, {});

CheckAuthorization.belongsTo(Checks);
Checks.hasMany(CheckAuthorization, { onDelete: 'cascade', hook: true });

export default CheckAuthorization;