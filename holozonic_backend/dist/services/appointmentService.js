"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
class AppointmentService {
    async listAll(filters = {}) {
        return await prisma_1.default.appointment.findMany({
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
    async create(data) {
        return await prisma_1.default.appointment.create({
            data: {
                ...data,
                status: 'SCHEDULED'
            }
        });
    }
    async updateStatus(id, status) {
        return await prisma_1.default.appointment.update({
            where: { id },
            data: { status }
        });
    }
    async getDetail(id) {
        return await prisma_1.default.appointment.findUnique({
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
    async finish(id, diagnosisDescription, prescriptionItems) {
        return await prisma_1.default.$transaction(async (tx) => {
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
exports.default = new AppointmentService();
//# sourceMappingURL=appointmentService.js.map