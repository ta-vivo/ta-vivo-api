import { User, UserCredential } from '../models/';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthService {

  static async login(credentials) {
    try {
      const user = await User.findOne({
        where: {
          username: credentials.username,
        },
      });

      if (!user) {
        throw ({status: 400, message: 'Invalid username or password'});
      }

      const userCredentials = await UserCredential.findOne({
        where: {
          userId: user.id,
        },
      });

      if (user && (await bcrypt.compare(credentials.password, userCredentials.password))) {

        const token = jwt.sign(
          { userId: user.id, username: credentials.username },
          process.env.TOKEN_KEY,
          {
            expiresIn: '2h',
          }
        );

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
        email,
        username: email
      });

      const hashedPassword = await bcrypt.hash(password, 10);

      await UserCredential.create({
        password: hashedPassword,
        userId: userCreated.id,
      });

      return userCreated;
    } catch (error) {
      throw error;
    }
  }


}

export default AuthService;