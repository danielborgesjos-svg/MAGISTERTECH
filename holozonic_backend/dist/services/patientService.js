"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../lib/prisma"));
class PatientService {
    async listAll() {
        return await prisma_1.default.patient.findMany({
            include: {
                user: { select: { email: true, role: true } },
                _count: { select: { appointments: true } }
            },
            orderBy: { fullName: 'asc' }
        });
    }
    async getDetail(id) {
        return await prisma_1.default.patient.findUnique({
            where: { id },
            include: {
                appointments: {
                    include: { diagnosis: true, prescription: true },
                    orderBy: { date: 'desc' }
                },
                anamneses: { orderBy: { createdAt: 'desc' } },
                user: { select: { email: true } }
            }
        });
    }
    async update(id, data) {
        return await prisma_1.default.patient.update({
            where: { id },
            data
        });
    }
}
exports.default = new PatientService();
//# sourceMappingURL=patientService.js.map