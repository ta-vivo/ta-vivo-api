import fetch from 'node-fetch';
import UserSubscription from '../models/UserSubscription';
import Role from '../models/Role';
import User from '../models/User';
class PayPalService {
  static async paypalRequestToken() {
    try {
      const accessToken = await this.generateAccessToken();
      const response = await fetch(`${process.env.PAYPAL_API}/v1/identity/generate-token`, {
        method: 'post',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return { clientToken: data.client_token };
    } catch (error) {
      throw error;
    }
  }

  static async generateAccessToken() {
    try {
      const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_APP_SECRET).toString('base64');
      const response = await fetch(`${process.env.PAYPAL_API}/v1/oauth2/token`, {
        method: 'post',
        body: 'grant_type=client_credentials',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw error;
    }

  }

  static async getPlans(accessToken) {
    try {
      const response = await fetch(`${process.env.PAYPAL_API}/v1/billing/plans`, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept-Language': 'en_US',
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data.plans;
    } catch (error) {
      throw error;
    }
  }

  static async paypalSubscription({ user, subscriptionId }) {
    try {
      const accessToken = await this.generateAccessToken();
      const response = await fetch(`${process.env.PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'get',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data && data.status === 'ACTIVE') {

        const plans = await this.getPlans(accessToken);
        const plan = plans.find(plan => plan.id === data.plan_id);

        const newRole = await Role.findOne({ where: { name: plan.name.toLowerCase() } });

        await User.update({ roleId: newRole.id }, { where: { id: user.id } });
        const currentSubscription = await UserSubscription.findOne({
          where: {
            userId: user.id
          },
        });

        if (currentSubscription) {
          await currentSubscription.destroy();
        }

        await UserSubscription.create({
          type: 'paypal',
          data: {
            subscriptionId,
          },
          userId: user.id,
        });
      }
      return {};
    } catch (error) {
      throw error;
    }
  }

  static async paypalSusbcriptionCancel({ user }) {
    try {

      const subscription = await UserSubscription.findOne({
        where: {
          userId: user.id,
          type: 'paypal'
        }
      });

      if (!subscription) {
        throw { message: 'Subscription not found', status: 404 };
      }

      const accessToken = await this.generateAccessToken();
      const body = {
        reason: 'Cancelled by customer'
      };
      try {
        await fetch(`${process.env.PAYPAL_API}/v1/billing/subscriptions/${subscription.data.subscriptionId}/cancel`, {
          method: 'post',
          body: JSON.stringify(body),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        const newRole = await Role.findOne({ where: { name: 'basic' } });

        await User.update({ roleId: newRole.id }, { where: { id: user.id } });
        await subscription.destroy();
        return { success: true };
      } catch (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }

}

export default PayPalService;