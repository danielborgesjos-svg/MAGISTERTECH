import { Router } from 'express';
import appointmentController from '../controllers/appointmentController';
import { authMiddleware } from '../middlewares/auth';

const appointmentRoutes = Router();

// Protected routes (Admin and Professionals)
// appointmentRoutes.use(authMiddleware(['ADMIN', 'PROFESSIONAL']));

appointmentRoutes.get('/', appointmentController.index);
appointmentRoutes.post('/', appointmentController.store);
appointmentRoutes.get('/:id', appointmentController.show);
appointmentRoutes.patch('/:id/status', appointmentController.updateStatus);
appointmentRoutes.post('/:id/finish', appointmentController.finish);
appointmentRoutes.post('/:id/meet', appointmentController.generateMeetLink);

export default appointmentRoutes;
