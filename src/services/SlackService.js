import { App } from '@slack/bolt';
import { Integration } from '../models/index';

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

class SlackService {

  static async createIntegration(user, { authorizationCode }) {
    try {
      const response = await app.client.oauth.v2.access({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
        code: authorizationCode
      });

      if (response.ok) {
        const integration = {
          appUserId: response.incoming_webhook.channel_id,
          name: response.incoming_webhook.channel,
          userId: user.id,
          type: 'slack',
        };

        await Integration.create(integration);
        return {};

      }
    } catch (error) {
      throw error;
    }
  }

  static async sendMessage(message, channelId) {
    try {
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        text: message
      });
    } catch (error) {
      console.log('🚀 ~ file: SlackService.js ~ line 45 ~ SlackService ~ sendMessage ~ error', error);
    }
  }

}

export default SlackService;