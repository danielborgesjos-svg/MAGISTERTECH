import { Router } from 'express';
import patientController from '../controllers/patientController';
import { authMiddleware } from '../middlewares/auth';

const patientRoutes = Router();

// Only ADMIN and PROFESSIONAL can access patient records
patientRoutes.use(authMiddleware(['ADMIN', 'PROFESSIONAL']));

patientRoutes.get('/', patientController.index);
patientRoutes.get('/:id', patientController.show);
patientRoutes.put('/:id', patientController.update);

export default patientRoutes;
