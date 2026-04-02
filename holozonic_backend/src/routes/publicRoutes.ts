import { Router } from 'express';
import publicController from '../controllers/publicController';

const publicRoutes = Router();

// Submit standalone anamnesis
publicRoutes.post('/anamnesis', publicController.createAnamnesis);

// Schedule appointment + triage (returns pix/id)
publicRoutes.post('/schedule', publicController.scheduleAppointment);

// Confirm pix payment
publicRoutes.patch('/schedule/:id/confirm', publicController.confirmPayment);

// Patient area (by cpf)
publicRoutes.get('/patient/:cpf/appointments', publicController.getPatientAppointments);

export default publicRoutes;
