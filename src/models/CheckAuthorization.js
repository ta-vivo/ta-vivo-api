import Sequelize from 'sequelize';
import { sequelize } from '../database/database';
import { Checks } from './index';

const CheckAuthorization = sequelize.define('check_authorizations', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  encryptedData: {
    type: Sequelize.JSONB,
    allowNull: false
  }
}, {});

CheckAuthorization.belongsTo(Checks);
Checks.hasMany(CheckAuthorization);

export default CheckAuthorization;