import { Router } from 'express';
import consultationController from '../controllers/consultationController';
import { authMiddleware } from '../middlewares/auth';

const consultationRoutes = Router();

// Only PROFESSIONALS can finalize consultations
consultationRoutes.post('/finalize', authMiddleware(['PROFESSIONAL']), consultationController.finalize);

export default consultationRoutes;
