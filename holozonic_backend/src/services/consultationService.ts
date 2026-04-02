import prisma from '../lib/prisma';

interface ConsultationData {
  appointmentId: string;
  diagnosis: string;
  prescriptionItems: any[];
}

class ConsultationService {
  async finalize(data: ConsultationData) {
    const { appointmentId, diagnosis, prescriptionItems } = data;

    // Use a transaction to ensure both are created and appointment status is updated
    return await prisma.$transaction(async (tx) => {
      // 1. Create Diagnosis
      const diag = await tx.diagnosis.create({
        data: {
          appointmentId,
          description: diagnosis
        }
      });

      // 2. Create Prescription
      const presc = await tx.prescription.create({
        data: {
          appointmentId,
          items: prescriptionItems,
          pdfUrl: '' // To be generated
        }
      });

      // 3. Update Appointment Status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'PERFORMED' }
      });

      return { diag, presc };
    });
  }
}

export default new ConsultationService();
