import StatusPageService from '../services/StatusPageService';
import Response from '../utils/response';
import querystringConverterHelper from '../utils/querystringConverterHelper';

class StatusPageController {

  static async create(req, res) {
    const newStatusPage = req.body;
    try {
      const entityCreated = await StatusPageService.create(newStatusPage, req.user);
      return res.json(Response.get('Status page created', entityCreated));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async getAll(req, res) {
    try {
      const { query } = req;

      let { where, limit, offset, order } = querystringConverterHelper.parseQuery(query);
      if (where) {
        where = { ...where, userId: req.user.id };
      } else {
        where = { userId: req.user.id };
      }

      const { rows, count, total } = await StatusPageService.getAll({
        criterions: {
          where,
          limit,
          offset,
          order,
        }
      });

      return res.json(Response.get('Status page list', rows, 200, { count, total, offset }));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }


  static async getById(req, res) {
    try {
      const { invitation_token } = req.query;
      const statusPage = await StatusPageService.getById({ uuid: req.params.uuid, user: req.user, invitation_token });

      if (statusPage) {
        return res.json(Response.get('Status Page found', statusPage));
      }
      return res.json(Response.get('Status Page not found', {}));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async getByuuid(req, res) {
    try {
      const { invitation_token, logs, check_id } = req.query;
      const { authenticationToken } = req;
      let statusPage;

      if(logs) {
        statusPage = await StatusPageService.getLogsByuuid({
          uuid: req.params.uuid,
          invitationToken: invitation_token,
          authenticationToken,
          checkId: check_id
        });
      } else {
        statusPage = await StatusPageService.getByuuid({
          uuid: req.params.uuid,
          invitationToken: invitation_token,
          authenticationToken
        });
      }

      if (statusPage) {
        return res.json(Response.get('Status Page found', statusPage));
      }
      return res.json(Response.get('Status Page not found', {}));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }

  static async update(req, res) {
    try {
      const statusPage = req.body;
      statusPage.uuid = req.params.uuid;
      const updatedStatusPage = await StatusPageService.update(statusPage, req.user);

      return res.json(Response.get('Status page Updated', updatedStatusPage));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }


  static async delete(req, res) {
    try {
      await StatusPageService.delete({ uuid: req.params.uuid }, req.user);
      return res.json(Response.get('Status Page not found', {}));
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || 'Something goes wrong',
        data: error
      });
    }
  }
}

export default StatusPageController;