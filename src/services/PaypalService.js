import fetch from 'node-fetch';

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
      console.log('🚀 ~ file: PaypalService.js ~ line 37 ~ PayPalService ~ generateAccessToken ~ error', error);
      throw error;
    }

  }
}

export default PayPalService;