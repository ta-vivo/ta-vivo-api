
import bcrypt from 'bcryptjs';
import { User, UserCredential, Role } from '../models';
import { sequelize } from './database';

const MandatoryData = async () => {
  return sequelize.sync({ force: (process.env.FORCE_SYNC == 'true') })
    .then(() => {
      console.log('Database & tables created!');
    })
    .then(async () => {
      console.log('Create initial data...');

      if (process.env.FORCE_SYNC == 'true') {

        // Roles
        const roles = [
          { id: 1, name: 'administrator' },
          { id: 2, name: 'basic' },
          { id: 3, name: 'pro' },
          { id: 4, name: 'enterprise' },
          { id: 5, name: 'enterprise+' },
        ];

        await Role.bulkCreate(roles);

        // Admin user
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        const admin = await User.findOne({ where: { email: adminUsername } });
        if (!admin) {
          const encryptedPassword = await bcrypt.hash(adminPassword, 10);
          const newUser = await User.create({
            email: adminUsername,
            fullname: 'Tavivo Admin',
            active: true,
            roleId: 1
          });

          await UserCredential.create({
            userId: newUser.id,
            password: encryptedPassword
          });

        }
      }
    })
    .then(() => {
      console.log('Done!');
      return;
    });
};

export { MandatoryData };