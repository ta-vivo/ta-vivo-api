import { StatusPages, StatusPageChecks, StatusPagesInvitations, Checks } from '../models';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { isValidEmail } from '../utils/validators';
import MailerService from './MailerService';

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

  static async getById({ uuid, user, invitation_token }) {
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

      if (statusPage && invitation_token){
        const decoded = jwt.verify(invitation_token, process.env.TOKEN_KEY);
        if (decoded.uuid === statusPage.uuid) {
          StatusPagesInvitations.update({
            status: 'accepted'
          }, {
            where: {
              'data.email': decoded.email,
              statusPageId: statusPage.id
            }
          });
        }
      }

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
        await this.parseEmailInvitations(newStatusPage.id, emailInvitations, uuid);
      }
      return newStatusPage;
    } catch (error) {
      console.log('🚀 ~ file: StatusPageService.js:79 ~ StatusPageService ~ create ~ error', error);
      throw error;
    }
  }

  static async update({ uuid, name, description, checksToAdd, checksToRemove, addEmailInvitations, removeEmailInvitations }, user) {
    try {
      const statusPage = await this.getById({ uuid, user });

      if (!statusPage) {
        throw { message: 'Status page not found', status: 404 };
      }

      if (name) {
        statusPage.name = name;
      }

      if (description) {
        statusPage.description = description;
      }

      const currentChecks = await StatusPageChecks.findAll({
        where: {
          statusPageId: statusPage.id
        }
      });

      if (checksToAdd && checksToAdd.length > 0) {
        let checksFound = await Checks.findAll({
          where: {
            id: checksToAdd
          }
        });

        if (currentChecks.length > 0) {
          checksFound = checksFound.filter(check => {
            const checkAlreadyAdded = currentChecks.find(currentCheck => {
              return currentCheck.checkId === check.id;
            });
            return !checkAlreadyAdded;
          });
        }

        if (checksFound.length > 0) {
          await StatusPageChecks.bulkCreate(checksFound.map(check => {
            return {
              statusPageId: statusPage.id,
              checkId: check.id
            };
          }
          ));
        }
      }

      if (checksToRemove && checksToRemove.length > 0) {
        await StatusPageChecks.destroy({
          where: {
            statusPageId: statusPage.id,
            checkId: checksToRemove
          }
        });
      }

      if (addEmailInvitations && addEmailInvitations.length > 0) {
        await this.parseEmailInvitations(statusPage.id, addEmailInvitations, statusPage.uuid);
      }

      if (removeEmailInvitations && removeEmailInvitations.length > 0) {
        for (let email of removeEmailInvitations) {

          await StatusPagesInvitations.destroy({
            where: {
              'data.email': email,
              statusPageId: statusPage.id
            }
          });
        }
      }

      await statusPage.save();
      const updatedStatusPage = await this.getById({ uuid, user });
      return updatedStatusPage;
    } catch (error) {
      console.log('🚀 ~ file: StatusPageService.js:79 ~ StatusPageService ~ create ~ error', error);
      throw error;
    }
  }

  static async delete({ uuid }, user) {
    try {
      const statusPage = await this.getById({ uuid, user });

      if (!statusPage) {
        throw { message: 'Status page not found', status: 404 };
      }

      await statusPage.destroy();
      return;
    } catch (error) {
      console.log('🚀 ~ file: StatusPageService.js:193 ~ StatusPageService ~ delete ~ error', error);
      throw error;
    }
  }

  static async parseEmailInvitations(statusPageId, emailInvitations, uuid) {
    const currentInvitations = await StatusPagesInvitations.findAll({
      where: {
        statusPageId: statusPageId,
        method: 'email',
      }
    });

    for (let email of emailInvitations) {
      if (!isValidEmail(email)) {
        continue;
      }

      if (currentInvitations.length > 0) {
        const emailAlreadyInvited = currentInvitations.find(invitation => {
          return invitation.data.email === email;
        });
        if (emailAlreadyInvited) {
          continue;
        }
      }

      const token = jwt.sign(
        {
          uuid: uuid,
          email: email
        },
        process.env.TOKEN_KEY
      );

      await StatusPagesInvitations.create({
        statusPageId: statusPageId,
        method: 'email',
        data: {
          email: email,
          token: token
        }
      });

      const { emailBody, emailSubject } = this.getInvitations(token);
      MailerService.sendMail({ to: email, subject: emailSubject, body: emailBody });
    }

    return;
  }

  /**
   * It returns an object with two properties, emailBody and emailSubject
   * @param token - The token that was generated when the invitation was created.
   * @returns An object with two properties, emailBody and emailSubject.
   */
  static getInvitations(token) {
    const emailBody = `
    <div style="text-align: center">
      <p>Hi,</p>
      <p>
        You have been invited to join a status page on
        <a style="color: #0D7EEC" href="https://tavivo.do">https://tavivo.do</a>.
      </p>
      <div style="margin: 20px auto">
        <button style="background-color: #0D7EEC; color: white; padding: 10px 20px; border: none; border-radius: 5px">
          <a href="https://tavivo.do/status-pages?invitation_token=${token}" style="color: white; text-decoration: none">
          Click here to enter to the status page
          </a>
        </button>
      </div>
      <div>
        or copy and paste this link into your browser:
        <a href="https://tavivo.do/status-pages?invitation_token=${token}">https://tavivo.do/status-pages?invitation_token=${token}</a>
      </div>
      <p>Thanks,</p>
      <p>The TaVivo team</p>
    </div>
    `;
    const emailSubject = 'You have been invited to join a status page on tavivo.do';

    return {
      emailBody,
      emailSubject
    };
  }


}

export default StatusPageService;