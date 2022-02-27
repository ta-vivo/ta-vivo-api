import { WebhookClient } from 'discord.js';
import axios from 'axios';
import { Integration } from '../models/index';

class discordService {

  static async createIntegration(user, { authorizationCode }) {
    try {
      const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        scope: 'webhook.incoming',
        code: authorizationCode,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      });

      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      axios.post('https://discord.com/api/oauth2/token', params, config)
        .then(async response => {
          const integration = {
            name: 'Discord',
            type: 'discord',
            appUserId: response.data.webhook.id,
            data: {
              token: response.data.webhook.token,
              channelId: response.data.webhook.channel_id
            },
            userId: user.id
          };

          await Integration.create(integration);
          return {};
        })
        .catch(error => {
          console.log(error);
        }
        );
      return {};
    } catch (error) {
      throw error;
    }
  }

  static async sendMessage(webhookId, webhookToken, message) {
    const webhookClient = new WebhookClient({ id: webhookId, token: webhookToken });

    webhookClient.send({
      content: message,
      username: 'Ta-vivo'
    });
  }

}

export default discordService;