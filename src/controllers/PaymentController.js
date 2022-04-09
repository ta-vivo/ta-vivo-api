import PaypalService from '../services/PaypalService';
import Response from '../utils/response';

class PaymentController {

  static async paypalRequestToken(req, res) {
    try {
      const token = await PaypalService.paypalRequestToken();

      return res.json(Response.get('Token found', token));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async paypalSusbcription(req, res) {
    try {
      const { subscriptionId } = req.body;
      const { user } = req;
      const subscription = await PaypalService.paypalSubscription({ subscriptionId, user });

      return res.json(Response.get('Subscription created', subscription));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async paypalTransactions(req, res) {
    try {
      const { user } = req;
      const transactions = await PaypalService.paypalTransactions({ user });

      return res.json(Response.get('Transactions found', transactions));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async paypalSusbcriptionCancel(req, res) {
    try {
      const { user } = req;
      const subscription = await PaypalService.paypalSusbcriptionCancel({ user });

      return res.json(Response.get('Subscription cancelled', subscription));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

}

export default PaymentController;