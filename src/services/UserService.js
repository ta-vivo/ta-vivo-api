import { User } from '../models/index';
import timezones from '../utils/timezones.json';

class UserService {
  static async update({ id, timezone }) {
    const user = await User.findOne({ where: { id } });
    if (user) {
      if (timezone) {
        if (!timezones.find(item => item.code === timezone)) {
          throw ({ status: 400, message: 'timezone is not valid' });
        }
        await user.update({ timezone });
      }
    }

    return user;
  }
}

export default UserService;