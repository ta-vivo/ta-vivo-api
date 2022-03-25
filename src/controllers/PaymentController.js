import PaypalService from '../services/PaypalService';
import Response from '../utils/response';

class PaymentController {

  static async paypalRequestToken(req, res) {
    try {
      const token = await PaypalService.paypalRequestToken();

      return res.json(Response.get('Token found', token));
    } catch (error) {
      return res.json(Response.get('Something goes wrong', error, 500));
    }
  }

  static async paypalSusbcription(req, res) {
    try {
      const { subscriptionId } = req.body;
      const { user } = req;
      const subscription = await PaypalService.paypalSubscription({ subscriptionId, user });

      return res.json(Response.get('Subscription created', subscription));
    } catch (error) {
      return res.json(Response.get('Something goes wrong', error, 500));
    }
  }

}

export default PaymentController;