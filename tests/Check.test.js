/* eslint-disable no-undef */
import { Checks, CheckIntegration, CheckLogs } from '../src/models';
import { expect } from 'chai';
import { checkPropertyExists } from 'sequelize-test-helpers';

describe('src/models/Check', () => {
  const check = new Checks();

  context('properties', () => {
    ['name', 'target', 'periodToCheck', 'periodToCheckLabel', 'enabled'].forEach(checkPropertyExists(check));
  });

  context('associations', () => {

    it('defined a hasMany association with Check \'CheckIntegration, CheckLogs\'', () => {
      expect(Checks.hasMany).to.have.been
        .calledWith(CheckIntegration)
        .calledWith(CheckLogs);
    });
  });

});