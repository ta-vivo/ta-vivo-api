import { App } from '@slack/bolt';
import { Integration } from '../models/index';
import axios from 'axios';

let app;

if(process.env.SLACK_SIGNING_SECRET && process.env.SLACK_BOT_TOKEN){
  app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    token: process.env.SLACK_BOT_TOKEN,
  });
}

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
          data: {
            token: response.access_token,
            channelId: response.incoming_webhook.channel_id,
            channel: response.incoming_webhook.channel,
            webhookURL: response.incoming_webhook.url,
            configurationUrl: response.incoming_webhook.configuration_url
          }
        };

        await Integration.create(integration);
        return {};

      }
    } catch (error) {
      throw error;
    }
  }

  static async sendMessage({ message, webhookURL }) {
    try {
      await axios.post(webhookURL, {
        text: message
      },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('🚀 ~ file: SlackService.js ~ line 45 ~ SlackService ~ sendMessage ~ error', error);
      throw { message: 'Error sending message to Slack', status: 500 };
    }
  }

}

export default SlackService;