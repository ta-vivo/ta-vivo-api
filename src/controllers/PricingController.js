import Response from '../utils/response';
import PricingServie from '../services/PricingService';

class PricingController {

  static async getAll(req, res) {
    try {
      const pricings = PricingServie.getAll();
      return res.json(Response.get('Pricings found', pricings));
    } catch (error) {
      return res.json(Response.get('Something goes wrong', error, 500));
    }
  }

}

export default PricingController;