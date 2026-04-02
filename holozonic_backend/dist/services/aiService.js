"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
class AIService {
    async handleInteraction(data) {
        const { patientEmail, patientName, patientPhone, interactionType, capturedData, agentName } = data;
        // 1. Check if patient user exists, or create a placeholder
        let user = await prisma_1.default.user.findUnique({ where: { email: patientEmail } });
        if (!user) {
            // Create a basic account (patient will update password later)
            user = await prisma_1.default.user.create({
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
        const patient = await prisma_1.default.patient.findUnique({ where: { userId: user.id } });
        if (!patient)
            throw new Error('Patient record not found');
        // 2. Based on interaction type, create Anamnesis or Appointment
        if (interactionType === 'TRIAGE') {
            return await prisma_1.default.anamnesis.create({
                data: {
                    patientId: patient.id,
                    data: capturedData,
                    capturedBy: agentName
                }
            });
        }
        if (interactionType === 'SCHEDULING') {
            // Create a preliminary appointment
            return await prisma_1.default.appointment.create({
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
exports.default = new AIService();
//# sourceMappingURL=aiService.js.map