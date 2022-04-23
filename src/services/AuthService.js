import { User, UserCredential, PendingEmailConfirmation, Role } from '../models/';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MailerService from '../services/MailerService';
import LimitsService from '../services/LimitsService';
class AuthService {

  static async login({ email, password }) {
    try {
      const user = await User.findOne({
        where: {
          email: email,
        },
        include: [
          {
            model: Role,
            attributes: ['name']
          },
        ],
      });

      if (!user) {
        throw ({ status: 400, message: 'Invalid email or password' });
      }

      const userCredentials = await UserCredential.findOne({
        where: {
          userId: user.id,
        },
      });

      if (user && (await bcrypt.compare(password, userCredentials.password))) {

        const response = await this.me({ user });

        return { token: response.token };
      }
      throw ({ status: 400, messages: 'Invalid credentials' });
    } catch (error) {
      throw error;
    }
  }

  static async me({ user }) {
    try {
      const userData = await User.findOne({
        where: {
          id: user.id,
        },
        include: [
          {
            model: Role,
            attributes: ['name']
          },
        ],
      });

      const currentChecksCount = await LimitsService.getCheckCount(user.id);
      const checkLimit = await LimitsService.getCheckLimit(user.id);
      const currentIntegrationsCount = await LimitsService.getIntegrationCount(user.id);
      const integrationLimit = await LimitsService.getIntegrationLimit(user.id);

      const token = this.createJWT({
        id: user.id,
        email: userData.email,
        fullname: userData.fullname,
        active: userData.active,
        enabled: userData.enabled,
        role: userData.role.name,
        settings: {
          checks: {
            count: currentChecksCount,
            limit: checkLimit
          },
          integrations: {
            count: currentIntegrationsCount,
            limit: integrationLimit
          }
        }
      });
      return { token };
    } catch (error) {
      throw error;
    }
  }

  static async register({ fullname, email, password, confirmPassword }) {
    try {
      if (password !== confirmPassword) {
        throw ({ status: 400, message: 'Passwords do not match' });
      }

      const user = await User.findOne({
        where: {
          email: email,
        },
      });

      if (user) {
        throw ({ status: 400, message: 'Email already exists' });
      }

      const basicRole = await Role.findOne({
        where: {
          name: 'basic',
        },
      });

      const userCreated = await User.create({
        fullname,
        email,
        roleId: basicRole.id
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      await UserCredential.create({
        password: hashedPassword,
        userId: userCreated.id,
      });

      const uniqueCode = `${userCreated.id}${Math.random().toString(36).substring(2, 7)}`;

      await PendingEmailConfirmation.create({
        userId: userCreated.id,
        uniqueCode: uniqueCode,
      });

      const emailBody = `
      <div style="text-align: center;">
        <h1>Verification code</h1>
        <p style="font-size: 30px; letter-spacing: 10px">
          ${uniqueCode}
        </p>
        <div>
          Here is your email verification code.
        </div>
        <div>
          It will expire in 10 minutes.
        </div>
        <p>
          Sent by Ta-vivo.
        </p>
      </div>
      `;

      MailerService.sendMail({ to: email, subject: 'Email confirmation', body: emailBody });
      const login = await this.login({ email, password });
      return login;
    } catch (error) {
      throw error;
    }
  }

  static async changePassword({ user, oldPassword, newPassword }) {
    try {

      if (this.isPasswordSecure(newPassword) === false) {
        throw ({ message: 'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter', status: 400 });
      }

      const userCredentials = await UserCredential.findOne({
        where: {
          userId: user.id,
        },
      });

      if (userCredentials && (await bcrypt.compare(oldPassword, userCredentials.password))) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserCredential.update({
          password: hashedPassword,
        }, {
          where: {
            userId: user.id,
          },
        });
        return { success: true };
      }
      throw ({ status: 400, message: 'Invalid credentials' });
    } catch (error) {
      throw error;
    }
  }

  static async registerEmailConfirmation({ user, uniqueCode }) {
    try {
      const pendingEmailConfirmation = await PendingEmailConfirmation.findOne({
        where: {
          userId: user.id,
          uniqueCode: uniqueCode,
        },
      });

      if (!pendingEmailConfirmation) {
        throw ({ status: 400, message: 'Invalid code' });
      }

      await User.update({
        active: true,
      }, {
        where: {
          id: user.id,
        },
      });

      await PendingEmailConfirmation.destroy({
        where: {
          userId: user.id,
        },
      });

      const response = await this.me({ user });

      return { token: response.token };
    } catch (error) {
      throw error;
    }
  }

  static async requestRegisterEmailConfirmation({ user }) {
    try {
      const uniqueCode = `${user.id}${Math.random().toString(36).substring(2, 7)}`;

      await PendingEmailConfirmation.create({
        userId: user.id,
        uniqueCode: uniqueCode,
      });

      const emailBody = `
      <div style="text-align: center;">
        <h1>Verification code</h1>
        <p style="font-size: 30px; letter-spacing: 10px">
          ${uniqueCode}
        </p>
        <div>
          Here is your email verification code.
        </div>
        <div>
          It will expire in 10 minutes.
        </div>
        <p>
          Sent by Ta-vivo.
        </p>
      </div>
      `;

      MailerService.sendMail({ to: user.email, subject: 'Email confirmation', body: emailBody });
      return {};
    } catch (error) {
      throw error;
    }
  }

  static createJWT(user) {
    const token = jwt.sign(
      { id: user.id, email: user.email, fullname: user.fullname, active: user.active, enabled: user.enabled, role: user.role, settings: user.settings },
      process.env.TOKEN_KEY,
      {
        expiresIn: '2h',
      }
    );

    return token;
  }


  static isPasswordSecure(password) {
    const regex = /^(?=.*[a-z])(?=.*[0-9])(?=.{8,})/;
    return regex.test(password);
  }

}

export default AuthService;