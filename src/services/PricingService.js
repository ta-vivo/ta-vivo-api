class PricingService {

  static getAll() {
    const pricing = [
      {
        id: 1,
        name: 'Basic',
        price: 0,
        features: [
          { item: 'checks', quantity: 10 },
          { item: 'logsHistory', quantity: 200 },
          { item: 'integrations', quantity: 10 },
        ],
      },
      {
        id: process.env.PAYPAL_PRO_SUBSCRIPTION_ID,
        name: 'Pro',
        price: 3,
        features: [
          { item: 'checks', quantity: 25 },
          { item: 'logsHistory', quantity: '1,000' },
          { item: 'integrations', quantity: 20 },
        ],
      },
      {
        id: process.env.PAYPAL_ENTERPRISE_SUBSCRIPTION_ID,
        name: 'Enterprise',
        price: 10,
        features: [
          { item: 'checks', quantity: 120 },
          { item: 'logsHistory', quantity: '5,000' },
          { item: 'integrations', quantity: 50 },
        ],
      },
      {
        id: process.env.PAYPAL_ENTERPRISEPLUS_SUBSCRIPTION_ID,
        name: 'Enterprise+',
        price: 20,
        features: [
          { item: 'checks', quantity: 500 },
          { item: 'logsHistory', quantity: '15,000' },
          { item: 'integrations', quantity: 100 },
        ],
      },
    ];
    return pricing;
  }

}

export default PricingService;