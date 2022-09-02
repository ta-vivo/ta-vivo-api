import axios from 'axios';
import cron from 'cron';
import { Checks, CheckLogs, CheckIntegration, Integration, Role, CheckAuthorization } from '../models/';
import TelegramService from './TelegramService';
import { Op } from 'sequelize';
import { sequelize } from '../database/database';
import cronTimeTable from '../utils/cronTimeList';
import { isValidDomain, isValidIpv4, isValidIpv4WithProtocol } from '../utils/validators';
import MailerService from '../services/MailerService';
import SlackService from '../services/SlackService';
import discordService from '../services/DiscordService';
import WhatsAppService from './WhatsappService';
import LogService from './LogService';
import LimitService from '../services/LimitsService';
import Audit from '../services/AuditService';
import { getCurrentDate } from '../utils/time';
import timezones from '../utils/timezones.json';
import { encrypt, decrypt } from '../utils/crypto';

let cronJobs = {};

class CheckService {

  static async create(newCheck) {
    const checkForCreate = {
      name: newCheck.name,
      target: newCheck.target,
      periodToCheck: newCheck.periodToCheck,
      enabled: newCheck.enabled ? newCheck.enabled : false,
      userId: newCheck.user.id,
      retryOnFail: newCheck.retryOnFail ? newCheck.retryOnFail : false,
      onFailPeriodToCheck: newCheck.onFailPeriodToCheck ? newCheck.onFailPeriodToCheck : null,
      onFailperiodToCheckLabel: newCheck.onFailperiodToCheckLabel ? newCheck.onFailperiodToCheckLabel : null,
      authorizationHeader: newCheck.authorizationHeader ? newCheck.authorizationHeader : null,
    };

    const t = await sequelize.transaction();

    const hasAlreadyReachedMaxChecks = await LimitService.hasAlreadyReachedMaxChecks(newCheck.user.id);
    if (hasAlreadyReachedMaxChecks) {
      throw ({ status: 400, message: 'You have reached the maximum number of checks' });
    }

    // check isValidDomain
    if (!isValidDomain(newCheck.target) && !isValidIpv4(newCheck.target) && !isValidIpv4WithProtocol(newCheck.target)) {
      throw ({ status: 400, message: 'The target is not valid' });
    }

    if (newCheck.timezone) {
      if (!timezones.find(item => item.code === newCheck.timezone)) {
        throw ({ status: 400, message: 'timezone is not valid' });
      }

      checkForCreate.timezone = newCheck.timezone;
    }

    try {
      const headers = {};
      if (newCheck.authorizationHeader) {
        headers[newCheck.authorizationHeader.name] = newCheck.authorizationHeader.token;
      }

      await axios.get(checkForCreate.target, { timeout: 5000, headers });

    } catch (error) {
      throw ({ status: 400, message: 'The target is unreachable' });
    }

    try {
      if (!cronTimeTable.find(item => item.label === newCheck.periodToCheck)) {
        throw ({ status: 400, message: 'periodToCheck is not valid' });
      }

      const periodToCheck = cronTimeTable.find(item => item.label === newCheck.periodToCheck).value;
      if (!periodToCheck) {
        throw ({ status: 400, message: 'periodToCheck is not valid' });
      }

      const userRole = await Role.findOne({ where: { id: newCheck.user.roleId } });
      if (!cronTimeTable.find(item => item.label === newCheck.periodToCheck).roles.includes(userRole.name)) {
        throw ({ status: 400, message: 'You are not allowed to create a check with this period' });
      }

      const exists = await this.isTargetExists(checkForCreate.target, checkForCreate.userId);
      if (exists) {
        throw ({ status: 400, message: 'Target already exists' });
      }

      if (userRole.name.toLowerCase() === 'basic') {
        delete checkForCreate.retryOnFail;
        delete checkForCreate.onFailPeriodToCheck;
        delete checkForCreate.onFailperiodToCheckLabel;
      }

      if (checkForCreate.retryOnFail) {
        if (!cronTimeTable.find(item => item.label === newCheck.onFailPeriodToCheck)) {
          throw ({ status: 400, message: 'onFailPeriodToCheck is not valid' });
        }

        const onFailPeriodToCheck = cronTimeTable.find(item => item.label === newCheck.onFailPeriodToCheck).value;
        if (!onFailPeriodToCheck) {
          throw ({ status: 400, message: 'onFailPeriodToCheck is not valid' });
        }
        checkForCreate.onFailPeriodToCheck = onFailPeriodToCheck;
        checkForCreate.onFailPeriodToCheckLabel = cronTimeTable.find(item => item.label === newCheck.onFailPeriodToCheck).label;
      }

      checkForCreate.periodToCheck = periodToCheck;
      checkForCreate.periodToCheckLabel = cronTimeTable.find(item => item.label === newCheck.periodToCheck).label;

      let entityCreated = await Checks.create(checkForCreate, { transaction: t });
      entityCreated = JSON.parse(JSON.stringify(entityCreated));

      if (newCheck.addIntegrations) {
        this.addIntegrations(entityCreated.id, newCheck.addIntegrations);
      }

      if (checkForCreate.authorizationHeader && checkForCreate.authorizationHeader.name && checkForCreate.authorizationHeader.token) {
        const encryptedHeaders = encrypt(checkForCreate.authorizationHeader.token);

        entityCreated.authorizationHeader = {
          name: checkForCreate.authorizationHeader.name,
          token: checkForCreate.authorizationHeader.token,
        };

        await CheckAuthorization.create({
          checkId: entityCreated.id,
          headerName: checkForCreate.authorizationHeader.name,
          encryptedToken: encryptedHeaders
        }, { transaction: t });
      }

      await t.commit();
      this.runCheck(entityCreated);
      return entityCreated;
    } catch (error) {
      t.rollback();
      console.log('🚀 ~ file: CheckService.js ~ line 62 ~ CheckService ~ create ~ error', error);
      throw error;
    }
  }

  static async update(id, check, user) {

    // check isValidDomain
    if (check.target && (!isValidDomain(check.target) && !isValidIpv4(check.target) && !isValidIpv4WithProtocol(check.target))) {
      throw ({ status: 400, message: 'The target is not valid' });
    }

    try {
      if (check.target) {

        const headers = {};

        if (check.authorizationHeader && check.authorizationHeader.name && check.authorizationHeader.token) {
          headers[check.authorizationHeader.name] = check.authorizationHeader.token;
        } else if (!check.removeAuthorizationHeader) {
          const authorizationHeader = await CheckAuthorization.findOne({ where: { checkId: id } });
          if (authorizationHeader) {
            headers[authorizationHeader.headerName] = decrypt(authorizationHeader.encryptedToken);
          }
        }

        await axios.get(check.target, { timeout: 5000, headers });
      }
    } catch (error) {
      throw ({ status: 400, message: 'The target is unreachable' });
    }

    if (check.timezone) {
      if (!timezones.find(item => item.code === check.timezone)) {
        throw ({ status: 400, message: 'timezone is not valid' });
      }
    }

    try {
      const checkForUpdate = {
        target: check.target,
        periodToCheck: check.periodToCheck,
        enabled: check.enabled ? check.enabled : false
      };

      if (check.timezone) {
        checkForUpdate.timezone = check.timezone;
      }

      let currentCheck = await Checks.findOne({ where: { id } });

      if (!currentCheck) {
        throw ({ status: 404, message: 'Check not found' });
      }

      const userRole = await Role.findOne({ where: { id: check.user.roleId } });
      if (!cronTimeTable.find(item => item.label === check.periodToCheck).roles.includes(userRole.name.toLowerCase())) {
        throw ({ status: 400, message: 'You are not allowed to create a check with this period' });
      }

      if (userRole.name.toLowerCase() === 'basic') {
        delete checkForUpdate.retryOnFail;
        delete checkForUpdate.onFailPeriodToCheck;
        delete checkForUpdate.onFailperiodToCheckLabel;
      }

      // eslint-disable-next-line no-prototype-builtins
      if (check.hasOwnProperty('retryOnFail')) {

        if (!cronTimeTable.find(item => item.label === check.onFailPeriodToCheck)) {
          throw ({ status: 400, message: 'onFailPeriodToCheck is not valid' });
        }

        const onFailPeriodToCheck = cronTimeTable.find(item => item.label === check.onFailPeriodToCheck).value;
        if (!onFailPeriodToCheck) {
          throw ({ status: 400, message: 'onFailPeriodToCheck is not valid' });
        }

        checkForUpdate.retryOnFail = check.retryOnFail;
        checkForUpdate.onFailPeriodToCheck = onFailPeriodToCheck;
        checkForUpdate.onFailPeriodToCheckLabel = cronTimeTable.find(item => item.label === check.onFailPeriodToCheck).label;
      }

      if (check.name) {
        checkForUpdate.name = check.name;
      }

      const periodToCheck = cronTimeTable.find(item => item.label === checkForUpdate.periodToCheck);
      if (!periodToCheck) {
        throw ({ status: 400, message: 'periodToCheck is not valid' });
      }

      let requireUpdateCron = false;
      let requireStopCron = false;

      if (check.removeAuthorizationHeader) {
        await CheckAuthorization.destroy({ where: { checkId: id } });
        requireUpdateCron = true;
      }

      if (check.authorizationHeader) {
        const encryptedHeaders = check.authorizationHeader.token ? encrypt(check.authorizationHeader.token) : null;

        const exist = await CheckAuthorization.findOne({ where: { checkId: id } });
        const authorizationToUpdate = {};

        if (exist) {
          if (check.authorizationHeader.name !== exist.headerName) {
            authorizationToUpdate.headerName = check.authorizationHeader.name;
          }

          if (encryptedHeaders) {
            authorizationToUpdate.encryptedToken = encryptedHeaders;
          }

          await CheckAuthorization.update({
            checkId: id,
            ...authorizationToUpdate
          }, { where: { checkId: id } });
        } else {
          await CheckAuthorization.create({
            checkId: id,
            headerName: check.authorizationHeader.name,
            encryptedToken: encryptedHeaders
          });
        }

        requireUpdateCron = true;
      }

      checkForUpdate.periodToCheck = periodToCheck.value;
      checkForUpdate.periodToCheckLabel = periodToCheck.label;

      currentCheck = JSON.parse(JSON.stringify(currentCheck));

      await Checks.update(checkForUpdate, { where: { id: id } });

      if (check.addIntegrations) {
        this.addIntegrations(id, check.addIntegrations);
      }

      if (check.removeIntegrations) {
        this.removeIntegrations(id, check.removeIntegrations);
      }

      let checkUpdated = await this.getById({ id, user });
      checkUpdated = JSON.parse(JSON.stringify(checkUpdated));

      const authorizationHeader = await CheckAuthorization.findOne({ where: { checkId: id } });

      if (authorizationHeader) {
        checkUpdated.authorizationHeader = {
          name: authorizationHeader.headerName,
          token: decrypt(authorizationHeader.encryptedToken)
        };
      }

      if (checkForUpdate.target !== currentCheck.target) {
        requireUpdateCron = true;
      }

      if (checkForUpdate.timezone !== currentCheck.timezone) {
        requireUpdateCron = true;
      }

      if (checkForUpdate.periodToCheck && checkForUpdate.periodToCheck !== currentCheck.periodToCheck) {
        requireUpdateCron = true;
        requireStopCron = true;
      }

      // eslint-disable-next-line no-prototype-builtins
      if (check.hasOwnProperty('enabled')) {
        checkForUpdate.enabled = check.enabled;
        if (check.enabled === true && currentCheck.enabled === false) {
          requireUpdateCron = true;
        } else if (check.enabled === false && currentCheck.enabled === true) {
          requireStopCron = true;
        }
      }

      if (checkForUpdate.enalbed === false && currentCheck.enabled === true) {
        requireStopCron = true;
      }

      if (requireStopCron) {
        this.stopCheck(checkUpdated);
        this.stopCheck(checkUpdated, true);
      }

      if (checkUpdated.enabled && requireUpdateCron) {
        this.stopCheck(checkUpdated);
        this.runCheck(checkUpdated);
      }

      Audit.onUpdate(user, { entity: 'check', old: currentCheck, edited: check });

      return checkUpdated;
    } catch (error) {
      throw error;
    }
  }

  static async disable({ id, user }) {
    try {
      const check = await Checks.findOne({ where: { id, userId: user.id } });

      if (!check) {
        throw ({ status: 404, message: 'Check not found' });
      }

      await Checks.update({ enabled: false }, { where: { id, userId: user.id } });
      this.stopCheck(check);
      this.stopCheck(check, `${check.id}_retry`);
      Audit.onUpdate(user, { entity: 'check', old: check, edited: { enabled: false } });
      return check;
    } catch (error) {
      throw error;
    }
  }

  static async enable({ id, user }) {
    try {
      let check = await Checks.findOne({ where: { id, userId: user.id } });

      if (!check) {
        throw ({ status: 404, message: 'Check not found' });
      }

      check = JSON.parse(JSON.stringify(check));

      const authorizationHeader = await CheckAuthorization.findOne({ where: { checkId: id } });

      if (authorizationHeader) {
        check.authorizationHeader = {
          name: authorizationHeader.headerName,
          token: decrypt(authorizationHeader.encryptedToken)
        };
      }

      await Checks.update({ enabled: true }, { where: { id, userId: user.id } });
      // stop to avoid cron duplicate
      this.stopCheck(check);
      this.stopCheck(check, `${check.id}_retry`);

      // Now run the check
      this.runCheck(check);
      Audit.onUpdate(user, { entity: 'check', old: check, edited: { enabled: true } });
      return check;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(params) {
    const { criterions } = params;

    try {
      const { rows, count } = await Checks.findAndCountAll({
        ...criterions,
        distinct: true,
        include: [
          {
            model: CheckIntegration,
            include: [{ model: Integration }]
          },
          { model: CheckAuthorization, attributes: ['headerName'], require: false }
        ]
      });
      return { rows, count: rows.length, total: count };
    } catch (error) {
      throw error;
    }
  }

  static async getById({ id, user }) {

    try {
      let check = await Checks.findOne({
        where: { id, userId: user.id },
        include: [{ model: CheckIntegration, include: [{ model: Integration }] }]
      });
      check = JSON.parse(JSON.stringify(check));

      const checkAuthorization = await CheckAuthorization.findOne({ where: { checkId: id } });

      if (checkAuthorization) {
        check.authorizationHeader = {
          name: checkAuthorization.headerName
        };
      }

      return check;
    } catch (error) {
      throw error;
    }
  }

  static async getLogsByCheckId({ id, criterions }) {

    try {
      if (criterions.where) {
        criterions.where.checkId = Number(id);
      } else {
        criterions.where = { checkId: Number(id) };
      }
      const { rows, count } = await CheckLogs.findAndCountAll({
        ...criterions
      });
      return { rows, count: rows.length, total: count };
    } catch (error) {
      throw error;
    }
  }

  static async delete({ id, user }) {
    try {
      const check = await Checks.findOne({ where: { id, userId: user.id } });
      const rowCount = await Checks.destroy({
        where: { id, userId: user.id }
      });
      // stop cron job
      this.stopCheck(check);
      this.stopCheck(check, true);

      Audit.onDelete(user, { entity: 'check', data: check });

      return { count: rowCount };
    } catch (error) {
      throw error;
    }
  }

  static runCheck(check, isRetry = false) {
    console.log('Run cron job for check: ', check.name);
    const cronJob = new cron.CronJob(check.periodToCheck, async () => {
      const { id, target, userId, timezone, authorizationHeader } = check;
      const durationStart = performance.now();
      let duration = 0;
      const headers = authorizationHeader ? { [authorizationHeader.name]: authorizationHeader.token } : {};

      try {
        await axios.get(target, {
          timeout: 5000,
          headers: { ...headers }
        });
        duration = (performance.now() - durationStart).toFixed(5);
        const successMessage = `✅ ${target} is alive at ${getCurrentDate(timezone)} (${timezone})`;
        console.log(successMessage);
        CheckLogs.create({
          checkId: id,
          status: 'up',
          duration: duration,
          timezone: timezone
        });
        LogService.cleanByRole({ checkId: id, userId: userId });

        if (isRetry) {
          const mostUpdatedCheck = await this.getById({ id: id, user: { id: userId } });
          if (mostUpdatedCheck) {
            this.sendNotification({
              message: successMessage,
              checkIntegrations: mostUpdatedCheck.check_integrations,
              meta: {
                isFailed: false,
                target: target,
                date: `${getCurrentDate(timezone)} (${timezone})`
              }
            });
          }
          this.stopCheck(check, `${check.id}_retry`);
        }
      } catch (error) {
        CheckLogs.create({
          checkId: id,
          status: 'down',
          duration: duration,
          timezone: timezone
        });
        LogService.cleanByRole({ checkId: id, userId: userId });

        if (check.retryOnFail && !cronJobs[`${id}_retry`] && !isRetry) {
          console.log('Retry cron job for check: ', check.name);
          const newCheck = check;
          newCheck.periodToCheck = check.onFailPeriodToCheck;
          this.runCheck(newCheck, true);
        }

        const mostUpdatedCheck = await this.getById({ id: id, user: { id: userId } });
        const message = isRetry ? `🚨 ${target} still down at ${getCurrentDate(timezone)} (${timezone})` : `🚨 ${target} is down at ${getCurrentDate(timezone)} (${timezone})`;

        if (mostUpdatedCheck) {
          this.sendNotification({
            message,
            checkIntegrations: mostUpdatedCheck.check_integrations,
            meta: {
              isFailed: true,
              isRetry: isRetry,
              target: target,
              date: `${getCurrentDate(timezone)} (${timezone})`
            }
          });
        }
        console.log(`🔥 send alert for ${target} at ${getCurrentDate(timezone)} (${timezone})`);
      }
    });
    const id = isRetry ? `${check.id}_retry` : check.id;
    cronJobs = { ...cronJobs, [id]: cronJob };
    cronJob.start();
  }


  /**
   * It stops the cron job for the given check
   * @param check - the check object
   * @param [customId=null] - This is the id of the check that we want to stop. can be only the check id or 
   * a custom key like `1_retry`
   */
  static stopCheck(check, customId = null) {
    const id = customId || check.id;
    const cronJob = cronJobs[id];
    if (cronJob) {
      console.log(`stop cron job for ${check.target} - id: ${id}`);
      cronJob.stop();
    }
  }

  static async addIntegrations(checkId, integrations) {
    try {
      const integrationsToAdd = integrations.map(integration => {
        return {
          checkId: checkId,
          integrationId: integration.id
        };
      });
      await CheckIntegration.bulkCreate(integrationsToAdd);
    } catch (error) {
      console.log(error);
    }
    return;
  }

  static async removeIntegrations(checkId, integrations) {
    const integrationsToRemove = integrations.map(integration => {
      return {
        checkId: checkId,
        integrationId: integration.id
      };
    });
    await CheckIntegration.destroy({
      where: {
        checkId: checkId,
        integrationId: integrationsToRemove.map(item => item.integrationId)
      }
    });
    return;
  }

  static async isTargetExists(target, userId) {
    const exits = await Checks.findOne({
      where: {
        target: {
          [Op.like]: `%${target}%`
        },
        userId
      }
    });
    return exits ? true : false;
  }

  static async sendNotification({ message, checkIntegrations, meta }) {
    checkIntegrations.forEach(async (integrationCheck) => {
      if (integrationCheck.integration.type === 'telegram') {
        TelegramService.sendMessage({
          userId: integrationCheck.integration.appUserId,
          message: message
        });
      } else if (integrationCheck.integration.type === 'email') {
        try {
          MailerService.sendMail({
            to: integrationCheck.integration.name,
            subject: message,
            body: message
          });
        } catch (error) {
          console.log('🚨 failed to send email', error);
        }
      } else if (integrationCheck.integration.type === 'slack') {
        try {
          SlackService.sendMessage(message, integrationCheck.integration.appUserId);
        } catch (error) {
          console.log('🚨 failed to send slack', error);
        }
      } else if (integrationCheck.integration.type === 'discord') {
        try {
          discordService.sendMessage(integrationCheck.integration.appUserId, integrationCheck.integration.data.token, message);
        } catch (error) {
          console.log('🚨 failed to send discord', error);
        }
      } else if (integrationCheck.integration.type === 'whatsapp') {
        if (meta.isFailed) {
          WhatsAppService.sendFail({
            phone: integrationCheck.integration.appUserId,
            target: meta.target,
            date: meta.date,
            isRetry: meta.isRetry
          }).catch(error => {
            console.log('🚨 failed to send whatsapp', error);
          });
        } else {
          WhatsAppService.sendSuccess({ phone: integrationCheck.integration.appUserId, target: meta.target, date: meta.date });
        }
      }
    });
  }

}

export default CheckService;