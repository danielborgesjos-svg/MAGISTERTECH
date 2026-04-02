import prisma from '../lib/prisma';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

interface CreateAppointmentDTO {
  patientId: string;
  professionalId?: string;
  date: Date;
  type: AppointmentType;
  procedureName?: string;
  price?: string;
  anamnesisId?: string;
}

class AppointmentService {
  async listAll(filters: any = {}) {
    return await prisma.appointment.findMany({
      where: filters,
      include: {
        patient: { select: { fullName: true, phone: true } },
        professional: { select: { fullName: true } },
        diagnosis: true,
        prescription: true
      },
      orderBy: { date: 'asc' }
    });
  }

  async create(data: CreateAppointmentDTO) {
    return await prisma.appointment.create({
      data: {
        ...data,
        status: 'SCHEDULED'
      }
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    return await prisma.appointment.update({
      where: { id },
      data: { status }
    });
  }

  async getDetail(id: string) {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        professional: true,
        diagnosis: true,
        prescription: true,
        anamnesis: true
      }
    });
  }

  async finish(id: string, diagnosisDescription: string, prescriptionItems: any) {
    return await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { status: 'PERFORMED' }
      });

      await tx.diagnosis.create({
        data: {
          appointmentId: id,
          description: diagnosisDescription
        }
      });

      return await tx.prescription.create({
        data: {
          appointmentId: id,
          items: prescriptionItems
        }
      });
    });
  }
}

export default new AppointmentService();
