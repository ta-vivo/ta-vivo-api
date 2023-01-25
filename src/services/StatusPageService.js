import { StatusPages, StatusPageChecks, StatusPagesInvitations, Checks } from '../models';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';

class StatusPageService {

  static async getAll({ criterions }) {
    try {
      const { where, limit, offset, order } = criterions;
      const { count, rows } = await StatusPages.findAndCountAll({
        where,
        limit,
        offset,
        order,
      });

      return { rows, count, total: count };
    } catch (error) {
      throw error;
    }
  }

  static async getById({ uuid, user }) {
    try {
      const statusPage = await StatusPages.findOne({
        where: {
          uuid,
          userId: user.id,
        },
        include: [
          {
            model: StatusPageChecks,
            include: [
              {
                model: Checks,
              }
            ]
          }
        ]
      });

      return statusPage;
    } catch (error) {
      throw error;
    }
  }

  static async create({ name, description, checks, emailInvitations }, user) {
    try {
      const uuid = v4();
      let checksFound = [];

      if (!name || !description || !checks) {
        throw { message: 'Missing parameters', status: 400 };
      }

      if (typeof checks !== 'object') {
        throw { message: 'Checks must be an array', status: 400 };
      }

      if (checks.length > 0) {
        checksFound = await Checks.findAll({
          where: {
            id: checks
          }
        });
      }

      const newStatusPage = await StatusPages.create({
        name,
        description,
        uuid,
        userId: user.id
      });

      if (checksFound.length > 0) {
        await StatusPageChecks.bulkCreate(checksFound.map(check => {
          return {
            statusPageId: newStatusPage.id,
            checkId: check.id
          };
        }
        ));
      }

      if (emailInvitations && emailInvitations.length > 0) {
        for (let invitation of emailInvitations) {
          const token = jwt.sign(
            { email: invitation },
            process.env.TOKEN_KEY
          );

          await StatusPagesInvitations.create({
            statusPageId: newStatusPage.id,
            method: 'email',
            data: {
              email: invitation,
              token: token
            }
          });

          // TODO: Send email
        }
      }
      return newStatusPage;
    } catch (error) {
      console.log('🚀 ~ file: StatusPageService.js:79 ~ StatusPageService ~ create ~ error', error);
      throw error;
    }
  }

}

export default StatusPageService;