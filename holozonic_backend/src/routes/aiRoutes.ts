import { Router } from 'express';
import aiController from '../controllers/aiController';

const aiRoutes = Router();

// Endpoint for Cecilia/Inez to feed the system
aiRoutes.post('/integration', aiController.webHook);

export default aiRoutes;
