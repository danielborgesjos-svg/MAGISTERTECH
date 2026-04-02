import { Request, Response } from 'express';
import appointmentService from '../services/appointmentService';

class AppointmentController {
  async index(req: Request, res: Response) {
    try {
      const appointments = await appointmentService.listAll(req.query);
      return res.json(appointments);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const appointment = await appointmentService.create(req.body);
      return res.status(201).json(appointment);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getDetail(id as string);
      if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
      return res.json(appointment);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await appointmentService.updateStatus(id as string, status);
      return res.json(appointment);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async finish(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { description, prescriptionItems } = req.body;
      const appointment = await appointmentService.finish(id as string, description, prescriptionItems);
      return res.json(appointment);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async generateMeetLink(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // In a real environment, you would call the Google Calendar / Google Meet API here.
      // We will generate a mock link and save it in the database.
      const mockStr = Math.random().toString(36).substring(2, 5) + '-' + 
                      Math.random().toString(36).substring(2, 6) + '-' + 
                      Math.random().toString(36).substring(2, 5);
      const meetLink = `https://meet.google.com/${mockStr}`;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { meetLink }
      });

      return res.json({ message: 'Link do Meet gerado com sucesso', meetLink, appointment });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new AppointmentController();
