import Response from '../utils/response';

class PricingController {

  static async getAll(req, res) {
    try {
      const pricing = [
        {
          id: 1,
          name: 'Free',
          price: 0,
          features: [
            { item: 'checks', quantity: 10 },
            { item: 'logsHistory', quantity: 200 },
            { item: 'integrations', quantity: 10 },
          ],
        },
        {
          id: 'P-7PA122898W931520MMI5IDEQ',
          name: 'Pro',
          price: 3,
          features: [
            { item: 'checks', quantity: 25 },
            { item: 'logsHistory', quantity: 1000 },
            { item: 'integrations', quantity: 20 },
          ],
        },
        {
          id: 'P-7PA122898W931520MMI5IDEQ',
          name: 'Enterprise',
          price: 10,
          features: [
            { item: 'checks', quantity: 120 },
            { item: 'logsHistory', quantity: 5000 },
            { item: 'integrations', quantity: 50 },
          ],
        },
        {
          id: 'P-7PA122898W931520MMI5IDEQ',
          name: 'Enterprise+',
          price: 20,
          features: [
            { item: 'checks', quantity: 500 },
            { item: 'logsHistory', quantity: 15000 },
            { item: 'integrations', quantity: 100 },
          ],
        },
      ];

      return res.json(Response.get('Pricing found', pricing));
    } catch (error) {
      return res.json(Response.get('Something goes wrong', error, 500));
    }
  }

}

export default PricingController;