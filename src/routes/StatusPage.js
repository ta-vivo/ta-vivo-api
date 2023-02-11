import { Router } from 'express';
import StatusPageController from '../controllers/StatusPageController';
import { verifyToken } from '../middlewares/Auth';

const router = Router();

router.get('/', verifyToken, StatusPageController.getAll);
router.get('/:uuid', verifyToken, StatusPageController.getById);
router.get('/view/:uuid', (req, _, next) => {
  // custom middleware to add the logged user token if this exists
  req.authenticationToken = req.body.token || req.query.token || req.headers['x-access-token'];
  return next();
}, StatusPageController.getByuuid);
router.put('/:uuid', verifyToken, StatusPageController.update);
router.post('/', verifyToken, StatusPageController.create);
router.delete('/:uuid', verifyToken, StatusPageController.delete);

export default router;