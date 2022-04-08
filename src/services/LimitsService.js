import { User, Role, Checks } from '../models';
import PricingService from './PricingService';

/**
 * This service is a helper to know all user limits like checks count, integrations count
 * 
 */
class LimitService {

  static async hasAlreadyReachedMaxChecks(userId) {
    const pricings = PricingService.getAll();
    const user = await User.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          model: Role,
          attributes: ['name']
        },
      ],
    });
    const role = pricings.find(pricing => pricing.name.toLowerCase() === user.role.name);

    if (role) {
      const limitOfChecks = role.features.find(feature => feature.item.toLowerCase() === 'checks').quantity;

      const currentCheckCount = await Checks.count({
        where: {
          userId
        }
      });
      return currentCheckCount >= limitOfChecks;
    }
  }

  static async getCheckCount (userId) {
    const currentCheckCount = await Checks.count({
      where: {
        userId
      }
    });
    return currentCheckCount;
  }

  static async getCheckLimit (userId) {
    const pricings = PricingService.getAll();
    const user = await User.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          model: Role,
          attributes: ['name']
        },
      ],
    });
    const role = pricings.find(pricing => pricing.name.toLowerCase() === user.role.name);

    if (role) {
      const limitOfChecks = role.features.find(feature => feature.item.toLowerCase() === 'checks').quantity;
      return limitOfChecks;
    }

    return 0;
  }

}

export default LimitService;