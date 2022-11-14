import { User, UserCredential, PendingEmailConfirmation, Role } from '../models/';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MailerService from '../services/MailerService';
import LimitsService from '../services/LimitsService';
import { v4 as uuidv4 } from 'uuid';
import Audit from './AuditService';
import supabase from '../utils/supabase';
import timezones from '../utils/timezones.json';
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
        await user.update({
          lastLogin: new Date(),
        });

        return { token: response.token };
      }
      throw ({ status: 400, message: 'Invalid email or password' });
    } catch (error) {
      throw error;
    }
  }

  static async google({ access_token, timezone }) {
    try {
      return supabase.auth.api.getUser(access_token)
        .then(async (supabaseResponse) => {

          if (supabaseResponse.error) {
            throw ({ message: 'Invalid credentials', status: 400 });
          }

          const exists = await User.findOne({
            where: {
              email: supabaseResponse.user.email,
            },
          });

          if (exists) {
            const response = await this.me({ user: exists });
            await exists.update({
              lastLogin: new Date(),
            });

            return { token: response.token };
          } else {

            const userCreated = await this.registerFromSupabase({
              supabaseUser: supabaseResponse.user,
              provider: 'google_provider',
              timezone: this.getValidTimezone(timezone)
            });

            const response = await this.me({ user: userCreated });
            return { token: response.token };
          }
        }).catch(error => {
          throw error;
        });

    } catch (error) {
      throw error;
    }
  }

  static async discord({ access_token, timezone }) {
    try {
      return supabase.auth.api.getUser(access_token)
        .then(async (supabaseResponse) => {
          if (supabaseResponse.error) {
            throw ({ message: 'Invalid credentials', status: 400 });
          }

          const exists = await User.findOne({
            where: {
              email: supabaseResponse.user.email,
            },
          });

          if (exists) {
            const response = await this.me({ user: exists });
            await exists.update({
              lastLogin: new Date(),
            });

            return { token: response.token };
          } else {

            const userCreated = await this.registerFromSupabase({
              supabaseUser: supabaseResponse.user,
              provider: 'discord_provider',
              timezone: this.getValidTimezone(timezone)
            });

            const response = await this.me({ user: userCreated });
            return { token: response.token };
          }
        }).catch(error => {
          throw error;
        });
    } catch (error) {
      throw error;
    }
  }

  static async slack({ access_token, timezone }) {
    try {
      return supabase.auth.api.getUser(access_token)
        .then(async (supabaseResponse) => {
          if (supabaseResponse.error) {
            throw ({ message: 'Invalid credentials', status: 400 });
          }

          const exists = await User.findOne({
            where: {
              email: supabaseResponse.user.email,
            },
          });

          if (exists) {
            const response = await this.me({ user: exists });
            await exists.update({
              lastLogin: new Date(),
            });

            return { token: response.token };
          } else {

            const userCreated = await this.registerFromSupabase({
              supabaseUser: supabaseResponse.user,
              provider: 'slack_provider',
              timezone: this.getValidTimezone(timezone)
            });

            const response = await this.me({ user: userCreated });
            return { token: response.token };
          }
        }).catch(error => {
          throw error;
        });
    } catch (error) {
      throw error;
    }
  }

  static async github({ access_token, timezone }) {
    try {
      return supabase.auth.api.getUser(access_token)
        .then(async (supabaseResponse) => {
          if (supabaseResponse.error) {
            throw ({ message: 'Invalid credentials', status: 400 });
          }

          const exists = await User.findOne({
            where: {
              email: supabaseResponse.user.email,
            },
          });

          if (exists) {
            const response = await this.me({ user: exists });
            await exists.update({
              lastLogin: new Date(),
            });

            return { token: response.token };
          } else {

            const userCreated = await this.registerFromSupabase({
              supabaseUser: supabaseResponse.user,
              provider: 'github_provider',
              timezone: this.getValidTimezone(timezone)
            });

            const response = await this.me({ user: userCreated });
            return { token: response.token };
          }
        }).catch(error => {
          throw error;
        });
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
        },
        timezone: userData.timezone || 'UTC',
        createdAt: userData.createdAt
      });
      return { token };
    } catch (error) {
      throw error;
    }
  }

  static async register({ fullname, email, password, confirmPassword, timezone }) {
    try {
      if (password !== confirmPassword) {
        throw ({ status: 400, message: 'Passwords do not match' });
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw ({ status: 400, message: 'Invalid email' });
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

      let userTimezone = 'UTC';

      if (timezones.find(item => item.code === timezone)) {
        userTimezone = timezone;
      }

      const userCreated = await User.create({
        fullname,
        email,
        roleId: basicRole.id,
        timezone: userTimezone
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

  static async registerFromSupabase({ supabaseUser, provider, timezone }) {
    const basicRole = await Role.findOne({
      where: {
        name: 'basic',
      },
    });

    const userCreated = await User.create({
      fullname: supabaseUser.user_metadata.full_name,
      email: supabaseUser.email,
      roleId: basicRole.id,
      active: true,
      timezone: timezone || 'UTC'
    });

    await UserCredential.create({
      password: '_',
      type: provider,
      userId: userCreated.id,
    });

    return userCreated;
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

        Audit.onUpdate(user, { action: 'password_change', old: {}, edited: {}, entity: 'user' });

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

  static async forgotPassword({ email }) {
    try {
      const user = await User.findOne({
        where: {
          email: email,
        },
      });

      if (!user) {
        return {};
      }

      const uniqueCode = uuidv4();

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
          Here is your password reset code.
        </div>
        <div>
          It will expire in 10 minutes.
        </div>
        <p>
          Sent by Ta-vivo.
        </p>
      </div>
      `;

      MailerService.sendMail({ to: email, subject: 'Password reset', body: emailBody });

      Audit.onUpdate(user, { action: 'password_forgot', entity: 'user' });

      return {};
    } catch (error) {
      throw error;
    }
  }

  static async recoverPassword({ email, uniqueCode, password }) {
    try {
      if (!this.isPasswordSecure(password)) {
        throw ({ message: 'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter', status: 400 });
      }

      const user = await User.findOne({
        where: {
          email: email,
        },
      });

      if (!user) {
        throw ({ status: 400, message: 'Invalid email' });
      }

      const pendingEmailConfirmation = await PendingEmailConfirmation.findOne({
        where: {
          uniqueCode: uniqueCode,
          userId: user.id,
        },
      });

      if (!pendingEmailConfirmation) {
        throw ({ status: 400, message: 'Invalid code' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await UserCredential.update({
        password: hashedPassword,
      }, {
        where: {
          userId: user.id,
        },
      });

      await PendingEmailConfirmation.destroy({
        where: {
          userId: user.id,
        },
      });

      return {};
    } catch (error) {
      throw error;
    }
  }

  static createJWT(user) {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        active: user.active,
        enabled: user.enabled,
        role: user.role,
        settings: user.settings,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      process.env.TOKEN_KEY,
      {
        expiresIn: '30d',
      }
    );

    return token;
  }


  static isPasswordSecure(password) {
    const regex = /^(?=.*[a-z])(?=.*[0-9])(?=.{8,})/;
    return regex.test(password);
  }

/**
 * It takes a timezone as an argument and returns a valid timezone
 * @param timezone - The timezone you want to convert to.
 * @returns The timezone code that is valid.
 */
  static getValidTimezone(timezone) {
    let newTimezone = 'UTC';

    if (timezones.find(item => item.code === timezone)) {
      newTimezone = timezone;
    }

    return newTimezone;
  }

}

export default AuthService;