/* eslint-disable no-undef */
import { Integration, CheckIntegration } from '../src/models';
import { expect } from 'chai';
import { checkPropertyExists } from 'sequelize-test-helpers';

describe('src/models/Integration', () => {
  const integration = new Integration();
  context('properties', () => {
    ['name', 'type', 'appUserId', 'data'].forEach(checkPropertyExists(integration));
  });

  context('associations', () => {

    it('defined a hasMany association with Check \'CheckIntegration\'', () => {
      expect(Integration.hasMany).to.have.been
        .calledWith(CheckIntegration);
    });
  });

});