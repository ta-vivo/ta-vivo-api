import Sequelize from 'sequelize';
import { sequelize } from '../../database/database';
import { StatusPages, Checks } from '../index';

const StatusPageChecks = sequelize.define('status_page_checks', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  }
}, {});

StatusPageChecks.belongsTo(StatusPages, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
StatusPages.hasMany(StatusPageChecks);

StatusPageChecks.belongsTo(Checks, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Checks.hasMany(StatusPageChecks);

export default StatusPageChecks;