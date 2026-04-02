import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

class PublicController {
  // 1. Submit isolated Anamnesis (Pre-Anamnesis modal)
  async createAnamnesis(req: Request, res: Response) {
    try {
      const { nome, tel, email, cpf, ...answers } = req.body;

      // Find or create user
      let user = await prisma.user.findUnique({ 
        where: { email },
        include: { patient: true }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: 'TEMPORARY_PATIENT',
            role: 'PATIENT',
            patient: {
              create: {
                fullName: nome,
                phone: tel,
                cpf: cpf || null,
              }
            }
          },
          include: { patient: true }
        });
      }

      let patient = user.patient || await prisma.patient.findUnique({ where: { userId: user.id } });
      if (!patient) throw new Error('Patient not found');

      // Update CPF if provided and it was empty
      if (cpf && !patient.cpf) {
        patient = await prisma.patient.update({ where: { id: patient.id }, data: { cpf } });
      }

      const anamnesis = await prisma.anamnesis.create({
        data: {
          patientId: patient.id,
          data: answers,
          capturedBy: 'WEB_FORM'
        }
      });

      return res.status(201).json({ message: 'Anamnese enviada com sucesso', anamnesisId: anamnesis.id });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // 2. Schedule Appointment with Pre-Anamnesis integrated (Tele / Presencial)
  async scheduleAppointment(req: Request, res: Response) {
    try {
      const { 
        nome, tel, email, 
        procedureName, type, price, date, 
        anamnesisData 
      } = req.body;

      // Validate inputs
      if (!nome || !tel || !email || !procedureName || !type) {
         return res.status(400).json({ error: 'Missing basic fields' });
      }

      // Handle User / Patient
      let user = await prisma.user.findUnique({ 
        where: { email },
        include: { patient: true }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: 'TEMPORARY_PATIENT',
            role: 'PATIENT',
            patient: {
              create: {
                fullName: nome,
                phone: tel,
              }
            }
          },
          include: { patient: true }
        });
      }
      const patient = user.patient || await prisma.patient.findUnique({ where: { userId: user.id } });
      if (!patient) throw new Error('Patient record missing');

      // Create Anamnesis if data provided
      let anamnesisId: string | undefined = undefined;
      if (anamnesisData) {
        const anamnesis = await prisma.anamnesis.create({
          data: {
            patientId: patient.id,
            data: anamnesisData,
            capturedBy: 'WEB_FORM_SCHEDULING'
          }
        });
        anamnesisId = anamnesis.id;
      }

      // Create Appointment AWAITING_PAYMENT
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          date: date ? new Date(date) : new Date(Date.now() + 86400000), // Tomorrow default
          type: type as AppointmentType,
          status: 'AWAITING_PAYMENT',
          procedureName,
          price,
          anamnesisId
        }
      });

      return res.status(201).json({ 
        message: 'Agendamento e Triagem iniciados', 
        appointmentId: appointment.id,
        status: appointment.status
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // 3. Confirm Payment (Simulates Pix validation)
  async confirmPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const appointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'SCHEDULED' }
      });
      return res.json({ message: 'Pagamento confirmado. Consulta agendada.', appointment });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // 4. Patient Area (By CPF / Email for prototyping)
  async getPatientAppointments(req: Request, res: Response) {
    try {
      const { cpf } = req.params;
      const patient = await prisma.patient.findUnique({
        where: { cpf },
        include: {
          appointments: {
            orderBy: { date: 'desc' }
          }
        }
      });

      if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });

      return res.json(patient);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new PublicController();
