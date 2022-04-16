import { User, Role, Checks } from '../src/models';
import { expect } from 'chai';
import { checkPropertyExists } from 'sequelize-test-helpers';

describe('src/models/User', () => {
  const user = new User();

  context('properties', () => {
    ['email', 'fullname', 'enabled', 'active'].forEach(checkPropertyExists(user));
  });

  context('associations', () => {

    it('defined a belongsTo association with Role', () => {
      expect(User.belongsTo).to.have.been.calledWith(Role);
    });

    it('defined a hasMany association with User as \'checks\'', () => {
      expect(User.hasMany).to.have.been.calledWith(Checks);
    });
  });

});