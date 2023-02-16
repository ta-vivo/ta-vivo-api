import { StatusPages, StatusPageChecks, StatusPagesInvitations, Checks, CheckLogs } from '../models';
import { v4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { isValidEmail } from '../utils/validators';
import MailerService from './MailerService';
import { Sequelize } from 'sequelize';

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
          },
          {
            model: StatusPagesInvitations,
            attributes: [
              'status',
              [Sequelize.json('data.email'), 'email']
            ],
          }
        ]
      });

      if (statusPage && invitation_token) {
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

  /**
   * This method is used to get a status page by uuid and get the data to 
   * view the status page with graphs and all the data
   * 
   * @params
   * uuid: the uuid of the status page
   * invitationToken: the invitation token to view the status page send via email for example
   * authenticationToken: the authentication token to view the status page if the user is logged
   */
  static async getByuuid({ uuid, invitationToken, authenticationToken }) {
    try {
      const statusPage = await StatusPages.findOne({ where: { uuid } });

      if (statusPage.isPublic) {
        return this.getStatusPage(statusPage);
      }

      if (invitationToken) {
        const decoded = jwt.verify(invitationToken, process.env.TOKEN_KEY);
        if (decoded.uuid !== uuid) {
          throw { message: 'Invalid invitation token', status: 400 };
        }

        return this.getStatusPage(statusPage);
      }

      // if the logged user is the owner of the status page
      if (authenticationToken) {
        const decoded = jwt.verify(authenticationToken, process.env.TOKEN_KEY);

        if (statusPage.userId === decoded.id) {
          return this.getStatusPage(statusPage);
        } else {
          throw { message: 'Forbidden', status: 403 };
        }
      }

      throw { message: 'Forbidden', status: 403 };

    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw { message: 'Invalid token', status: 400 };
      }
      throw error;
    }
  }

  static async getLogsByuuid({ uuid, checkId, invitationToken, authenticationToken }) {
    try {
      if (!checkId) {
        throw { message: 'Missing check id', status: 400 };
      }

      const statusPage = await StatusPages.findOne({ where: { uuid } });

      // check if the status page is public
      if (statusPage.isPublic) {
        return await this.getStatusPagesCheckLogs(checkId);
      }

      if (invitationToken) {
        const decoded = jwt.verify(invitationToken, process.env.TOKEN_KEY);
        if (decoded.uuid !== uuid) {
          throw { message: 'Invalid invitation token', status: 400 };
        }

        return await this.getStatusPagesCheckLogs(checkId);
      }

      // if the logged user is the owner of the status page
      if (authenticationToken) {
        const decoded = jwt.verify(authenticationToken, process.env.TOKEN_KEY);

        if (statusPage.userId === decoded.id) {
          return await this.getStatusPagesCheckLogs(checkId);
        } else {
          throw { message: 'Forbidden', status: 403 };
        }
      }

      throw { message: 'Forbidden', status: 403 };

    } catch (error) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw { message: 'Invalid token', status: 400 };
      }
      throw error;
    }
  }

  static async create({ name, description, checks, emailInvitations, isPublic }, user) {
    try {
      const uuid = v4();
      let checksFound = [];

      if (!name || !checks) {
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
        userId: user.id,
        isPublic: isPublic || false
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

  static async update({ uuid, name, description, isPublic, checksToAdd, checksToRemove, addEmailInvitations, removeEmailInvitations }, user) {
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

      if (typeof isPublic === 'boolean') {
        statusPage.isPublic = isPublic;
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

      const { emailBody, emailSubject } = this.getInvitations(token, uuid);
      MailerService.sendMail({ to: email, subject: emailSubject, body: emailBody });
    }

    return;
  }

  /**
   * It returns an object with two properties, emailBody and emailSubject
   * @param token - The token that was generated when the invitation was created.
   * @returns An object with two properties, emailBody and emailSubject.
   */
  static getInvitations(token, uuid) {
    const emailBody = `
    <div style="text-align: center">
      <p>Hi,</p>
      <p>
        You have been invited to join a status page on
        <a style="color: #0D7EEC" href="https://tavivo.do">https://tavivo.do</a>.
      </p>
      <div style="margin: 20px auto">
        <button style="background-color: #0D7EEC; color: white; padding: 10px 20px; border: none; border-radius: 5px">
          <a href="https://tavivo.do/status-pages/view/${uuid}?invitation_token=${token}" style="color: white; text-decoration: none">
          Click here to enter to the status page
          </a>
        </button>
      </div>
      <div>
        or copy and paste this link into your browser:
        <a href="https://tavivo.do/status-pages/view/${uuid}?invitation_token=${token}">https://tavivo.do/status-pages/view/${uuid}?invitation_token=${token}</a>
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

  static async getStatusPage(statusPage) {
    let checks = await StatusPageChecks.findAll({
      where: {
        statusPageId: statusPage.id
      },
      include: [
        {
          model: Checks,
          attributes: ['id', 'name', 'target', 'periodToCheckLabel', 'timezone']
        }
      ]
    });

    checks = checks.map(check => {
      return {
        ...check.check.dataValues
      };
    });

    for (let check of checks) {
      // find the last logs of the check
      // This need to do separate because of the limitation of sequelize
      const checkLog = await CheckLogs.findOne({
        attributes: ['status', 'duration', 'createdAt'],
        where: { checkId: check.id },
        order: [['createdAt', 'DESC']]
      });

      check.lastLog = checkLog;
    }
    return { ...statusPage.dataValues, checks, isTheOwner: true };
  }

  static async getStatusPagesCheckLogs(checkId) {
    return CheckLogs.findAll({
      attributes: ['status', 'duration', 'createdAt'],
      where: { checkId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
  }


}

export default StatusPageService;