import { User, Role } from '../src/models';
import { expect } from 'chai';

// eslint-disable-next-line no-undef
it('defined a belongsTo association with Company', () => {
  expect(User.belongsTo).to.have.been.calledWith(Role);
});