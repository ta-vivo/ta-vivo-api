import { Integration, PendingIntegration, CheckIntegration } from '../models';
import MailerService from '../services/MailerService';
import TelegramService from '../services/TelegramService';
import SlackService from '../services/SlackService';
import discordService from '../services/DiscordService';
import WhatsappService from './WhatsappService';
import Audit from './AuditService';
class IntegrationService {

  static async requestEmailConfirmation({ email, user }) {
    try {
      const uniqueCode = `${user.id}${Math.random().toString(36).substring(2, 7)}`;
      await PendingIntegration.create({
        data: {
          email: email
        },
        uniqueCode,
        appUserId: user.id,
        integrationType: 'email'
      });

      const emailBody = `
      <div style="text-align: center;">
        <h1>Verification code</h1>
        <p style="font-size: 30px; letter-spacing: 10px">
          ${uniqueCode}
        </p>
        <div>
          Here is your email verification code.
        </div>
        <div>
          It will expire in 10 minutes.
        </div>
        <p>
          Sent by Ta-vivo.
        </p>
      </div>
      `;

      MailerService.sendMail({ to: email, subject: 'Email confirmation', body: emailBody });
      return;
    } catch (error) {
      throw error;
    }
  }

  static async requestWhatsappConfirmation({ phone, user }) {
    try {
      if (/^[\\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(phone) === false || String(phone).length !== 11) {
        throw { message: 'Invalid phone number format', status: 400 };
      }

      const uniqueCode = 'w' + Math.random().toString(36).substring(2, 7);
      const message = `Your unique code is: ${uniqueCode}`;

      const exists = await Integration.findOne({ where: { userId: user.id, appUserId: phone } });

      if (exists) {
        throw { message: 'The integration already exists', status: 400 };
      }

      await PendingIntegration.create({
        uniqueCode,
        integrationType: 'whatsapp',
        appUserId: phone
      });

      await WhatsappService.sendMessage({ phone, message });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Telegram and email for this moment
   * 
  */
  static async create({ newIntegration, user }) {
    try {
      const pendingIntegration = await PendingIntegration.findOne({
        where: {
          uniqueCode: newIntegration.uniqueCode
        }
      });
      if (!pendingIntegration) {
        throw ({ status: 400, message: 'Integration not found' });
      }

      const integration = {
        appUserId: pendingIntegration.appUserId,
        type: pendingIntegration.integrationType,
        userId: user.id,
        name: pendingIntegration.integrationType === 'email' ? pendingIntegration.data.email : newIntegration.name,
      };
      const entityCreated = await Integration.create(integration);
      await pendingIntegration.destroy();
      return entityCreated;
    } catch (error) {
      throw error;
    }
  }

  static async update({ id, integration, user }) {
    try {

      const currentIntegration = await Integration.findOne({ where: { id, userId: user.id } });

      if (!currentIntegration) {
        throw ({ status: 400, message: 'Integration not found' });
      }

      const entityUpdated = await Integration.update(integration, {
        where: {
          id,
          userId: user.id
        }
      });

      Audit.onUpdate(user, { entity: 'integration', edited: integration, old: currentIntegration });

      return entityUpdated;
    } catch (error) {
      throw error;
    }
  }

  static async getAll({ criterions, user }) {
    try {
      if (criterions.where) {
        criterions.where.userId = user.id;
      } else {
        criterions.where = { userId: user.id };
      }

      const { rows, count } = await Integration.findAndCountAll({
        ...criterions,
        include: [{
          model: CheckIntegration
        }]
      });
      return { rows, count: rows.length, total: count };
    } catch (error) {
      throw error;
    }
  }

  static async test({ id, user }) {
    try {
      const integration = await Integration.findOne({ where: { id: id, userId: user.id } });

      if (!integration) {
        throw ({ status: 400, message: 'Integration not found' });
      }

      const message = 'This is a TEST, everything is fine. ✅';

      if (integration.type === 'telegram') {
        TelegramService.sendMessage({
          userId: integration.appUserId,
          message: message
        });
      } else if (integration.type === 'email') {
        try {
          MailerService.sendMail({
            to: integration.name,
            subject: message,
            body: message
          });
        } catch (error) {
          console.log('🚨 failed to send email', error);
        }
      } else if (integration.type === 'slack') {
        try {
          SlackService.sendMessage(message, integration.appUserId);
        } catch (error) {
          console.log('🚨 failed to send slack', error);
        }
      } else if (integration.type === 'discord') {
        try {
          discordService.sendMessage(integration.appUserId, integration.data.token, message);
        } catch (error) {
          console.log('🚨 failed to send discord', error);
        }
      }

      Audit.onUpdate(user, { entity: 'integration', action: 'integration_test' });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  static async delete({ id, user }) {
    try {
      const integration = await Integration.findOne({ where: { id: id, userId: user.id } });

      const rowCount = await Integration.destroy({
        where: { id, userId: user.id }
      });

      Audit.onDelete(user, { entity: 'integration', data: integration });

      return { count: rowCount };
    } catch (error) {
      throw error;
    }
  }

}

export default IntegrationService;