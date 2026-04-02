"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
class ConsultationService {
    async finalize(data) {
        const { appointmentId, diagnosis, prescriptionItems } = data;
        // Use a transaction to ensure both are created and appointment status is updated
        return await prisma_1.default.$transaction(async (tx) => {
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
exports.default = new ConsultationService();
//# sourceMappingURL=consultationService.js.map