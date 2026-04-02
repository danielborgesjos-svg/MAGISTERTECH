import { Router } from 'express';
import authRoutes from './authRoutes';
import aiRoutes from './aiRoutes';
import patientRoutes from './patientRoutes';
import appointmentRoutes from './appointmentRoutes';
import consultationRoutes from './consultationRoutes';
import publicRoutes from './publicRoutes';

const routes = Router();

// Auth Routes
routes.use('/auth', authRoutes);

// AI Integration Routes (Webhook)
routes.use('/ai', aiRoutes);

// Public Endpoints (Landing Page)
routes.use('/public', publicRoutes);

// Patient Management
routes.use('/patients', patientRoutes);

// Appointments & Agenda
routes.use('/appointments', appointmentRoutes);

// Consultations (Diagnosis & Prescriptions)
routes.use('/consultations', consultationRoutes);

export default routes;
