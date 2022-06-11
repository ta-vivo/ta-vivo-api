import AuthService from '../services/AuthService';
import Response from '../utils/response';

class AuthController {

  static async login(req, res) {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        throw ({ message: 'Email and password are required', status: 400 });
      }

      const entityCreated = await AuthService.login({ email, password });

      setTimeout(() => {
        return res.json(Response.get('success', entityCreated));
      }, 2000);
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async register(req, res) {
    const { fullname, email, password, confirmPassword } = req.body;
    try {
      const entityCreated = await AuthService.register({
        fullname, email, password, confirmPassword
      });
      return res.json(Response.get('success', entityCreated));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async me(req, res) {
    try {
      const user = await AuthService.me({ user: req.user });
      return res.json(Response.get('success', user));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async changePassword(req, res) {
    const { oldPassword, password, confirmPassword } = req.body;
    try {
      if (!oldPassword || !password || !confirmPassword) {
        throw ({ message: 'Old password, password and confirm password are required', status: 400 });
      }

      if (password !== confirmPassword) {
        throw ({ message: 'Password and confirm password must be the same', status: 400 });
      }

      if (password === oldPassword) {
        throw ({ message: 'New password must be different from old password', status: 400 });
      }

      const user = await AuthService.changePassword({
        user: req.user,
        oldPassword,
        newPassword: password
      });
      return res.json(Response.get('success', user));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async registerEmailConfirmation(req, res) {
    const { uniqueCode } = req.body;
    const user = req.user;
    try {
      const token = await AuthService.registerEmailConfirmation({ user, uniqueCode });
      return res.json(Response.get('success', token));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async requestRegisterEmailConfirmation(req, res) {
    const user = req.user;
    try {
      await AuthService.requestRegisterEmailConfirmation({ user });
      return res.json(Response.get('success', {}));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      await AuthService.forgotPassword({ email });
      /**
       * Ensure that responses return in a consistent amount of time to prevent an attacker enumerating which accounts exist.
       * https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html#forgot-password-request
       */
      setTimeout(() => {
        return res.json(Response.get('success', {}));
      }, 5000);

    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async recoverPassword(req, res) {
    const { email, uniqueCode, password, confirmPassword } = req.body;
    try {
      if (!email || !uniqueCode || !password || !confirmPassword) {
        throw ({ message: 'Email, unique code, password and confirm password are required', status: 400 });
      }

      if (password !== confirmPassword) {
        throw ({ message: 'Password and confirm password must be the same', status: 400 });
      }

      const user = await AuthService.recoverPassword({
        uniqueCode, password, email
      });
      return res.json(Response.get('success', user));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async google(req, res) {
    const { access_token } = req.body;
    try {
      const user = await AuthService.google({ access_token });
      return res.json(Response.get('success', user));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async discord(req, res) {
    const { access_token } = req.body;
    try {
      const user = await AuthService.discord({ access_token });
      return res.json(Response.get('success', user));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async slack(req, res) {
    const { access_token } = req.body;
    try {
      const user = await AuthService.slack({ access_token });
      return res.json(Response.get('success', user));
    }
    catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async github(req, res) {
    const { access_token } = req.body;
    try {
      const user = await AuthService.github({ access_token });
      return res.json(Response.get('success', user));
    }
    catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }
}

export default AuthController;