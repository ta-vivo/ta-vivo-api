import { User, UserCredential, PendingEmailConfirmation } from '../models/';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import MailerService from '../services/MailerService';

class AuthService {

  static async login({ email, password }) {
    try {
      const user = await User.findOne({
        where: {
          email: email,
        },
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

        const token = this.createJWT({
          userId: user.id, email: email, active: user.active, enabled: user.enabled
        });

        return { token: token };
      }
      throw ({ status: 400, messages: 'Invalid credentials' });
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

      const userCreated = await User.create({
        fullname,
        email
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

  static async registerEmailConfirmation({ user, uniqueCode }) {
    try {
      const pendingEmailConfirmation = await PendingEmailConfirmation.findOne({
        where: {
          userId: user.userId,
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
          id: user.userId,
        },
      });

      await PendingEmailConfirmation.destroy({
        where: {
          userId: user.userId,
        },
      });

      const updatedUser = await User.findOne({ where: { id: user.userId } });

      const token = this.createJWT({
        userId: updatedUser.id, email: updatedUser.email, active: updatedUser.active, enabled: updatedUser.enabled
      });

      return { token };
    } catch (error) {
      throw error;
    }
  }

  static async requestRegisterEmailConfirmation({ user }) {
    try {
      const uniqueCode = `${user.userId}${Math.random().toString(36).substring(2, 7)}`;

      await PendingEmailConfirmation.create({
        userId: user.userId,
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
      { userId: user.id, email: user.email, active: user.active, enabled: user.enabled },
      process.env.TOKEN_KEY,
      {
        expiresIn: '2h',
      }
    );

    return token;
  }

}

export default AuthService;