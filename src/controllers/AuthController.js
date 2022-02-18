import AuthService from '../services/AuthService';
import Response from '../utils/response';

class AuthController {

  static async login(req, res) {
    const {email, password} = req.body;
    try {
      const entityCreated = await AuthService.login({ email, password});
      return res.json(Response.get('success', entityCreated));
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

  static async registerEmailConfirmation(req, res) {
    const { uniqueCode } = req.body;
    const user = req.user;
    try {
      await AuthService.registerEmailConfirmation({ user, uniqueCode });
      return res.json(Response.get('success', {}));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

}

export default AuthController;