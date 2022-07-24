import Response from '../utils/response';
import UserServie from '../services/UserService';

class UserController {

  static async update(req, res) {
    try {
      const data = req.body;
      const user = req.user;

      await UserServie.update({ ...data, id: user.id });
      return res.json(Response.get('User updated', {}, 200));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

}

export default UserController;