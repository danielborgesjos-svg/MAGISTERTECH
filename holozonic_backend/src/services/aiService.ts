import prisma from '../lib/prisma';

interface AIInteractionData {
  patientEmail: string;
  patientName: string;
  patientPhone: string;
  interactionType: 'TRIAGE' | 'SCHEDULING';
  capturedData: any;
  agentName: 'CECILIA' | 'INEZ';
}

class AIService {
  async handleInteraction(data: AIInteractionData) {
    const { patientEmail, patientName, patientPhone, interactionType, capturedData, agentName } = data;

    // 1. Check if patient user exists, or create a placeholder
    let user = await prisma.user.findUnique({ where: { email: patientEmail } });

    if (!user) {
      // Create a basic account (patient will update password later)
      user = await prisma.user.create({
        data: {
          email: patientEmail,
          password: 'TEMPORARY_AI_PASSWORD', // Should trigger change password flow
          role: 'PATIENT',
          patient: {
            create: {
              fullName: patientName,
              phone: patientPhone,
            }
          }
        },
        include: { patient: true }
      });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });

    if (!patient) throw new Error('Patient record not found');

    // 2. Based on interaction type, create Anamnesis or Appointment
    if (interactionType === 'TRIAGE') {
      return await prisma.anamnesis.create({
        data: {
          patientId: patient.id,
          data: capturedData,
          capturedBy: agentName
        }
      });
    }

    if (interactionType === 'SCHEDULING') {
      // Create a preliminary appointment
      return await prisma.appointment.create({
        data: {
          patientId: patient.id,
          date: new Date(capturedData.requestedDate || new Date()),
          procedureName: capturedData.procedure || 'Consulta Geral',
          status: 'AWAITING_PAYMENT',
          type: capturedData.type || 'TELECONSULTA'
        }
      });
    }
  }
}

export default new AIService();
