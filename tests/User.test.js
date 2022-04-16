/* eslint-disable no-undef */
import { User, Role, Checks, Integration, UserSubscription, PendingEmailConfirmation, UserCredential } from '../src/models';
import { expect } from 'chai';
import { checkPropertyExists } from 'sequelize-test-helpers';

describe('src/models/User', () => {
  const user = new User();

  context('properties', () => {
    ['email', 'fullname', 'enabled', 'active'].forEach(checkPropertyExists(user));
  });

  context('associations', () => {

    it('defined a hasOne association with PendingEmailConfirmation, UserCredential', () => {
      expect(User.hasOne).to.have.been
        .calledWith(PendingEmailConfirmation);
    });

    it('defined a belongsTo association with Role', () => {
      expect(User.belongsTo).to.have.been.calledWith(Role);
    });

    it('defined a hasMany association with User \'checks, Integration, UserSubscription\'', () => {
      expect(User.hasMany).to.have.been
        .calledWith(Checks)
        .calledWith(Integration)
        .calledWith(UserSubscription)
        .calledWith(UserCredential);
    });
  });

});