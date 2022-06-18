import { User, Role, CheckLogs } from '../models';

class LogService {

  static async cleanByRole({ checkId, userId }) {
    try {
      const rolesLimits = [
        { role: 'basic', limit: 200 },
        { role: 'pro', limit: 1000 },
        { role: 'enterprise', limit: 5000 },
        { role: 'enterprise+', limit: 15000 },
      ];

      const user = await User.findOne({
        where: {
          id: userId,
        },
        include: [
          {
            model: Role,
            attributes: ['name']
          },
        ],
      });
      
      const limit = rolesLimits.find(role => role.role.toLowerCase() === user.role.name)?.limit;

      if (limit) {
        const logs = await CheckLogs.count({
          where: {
            checkId: checkId
          },
          order: [['createdAt', 'DESC']],
          limit: limit,
        });
        
        if (logs >= limit) {
          // delete the oldest logs after limit
          const logsToDelete = await CheckLogs.findAll({
            where: {
              checkId: checkId
            },
            order: [['createdAt', 'ASC']],
            limit: logs - limit,
          });
          await CheckLogs.destroy({
            where: {
              id: logsToDelete.map(log => log.id)
            }
          });
          console.log('X Logs Cleaned from check', checkId);
        }
      }


    } catch (error) {
      console.log('Error cleaning logs', error);
    }

  }

}

export default LogService;