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
declare class AppointmentService {
    listAll(filters?: any): Promise<({
        patient: {
            fullName: string;
            phone: string;
        };
        professional: {
            fullName: string;
        } | null;
        diagnosis: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            description: string;
        } | null;
        prescription: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            items: import("@prisma/client/runtime/client").JsonValue;
            pdfUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        professionalId: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.AppointmentType;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        procedureName: string | null;
        price: string | null;
        anamnesisId: string | null;
    })[]>;
    create(data: CreateAppointmentDTO): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        professionalId: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.AppointmentType;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        procedureName: string | null;
        price: string | null;
        anamnesisId: string | null;
    }>;
    updateStatus(id: string, status: AppointmentStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        professionalId: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.AppointmentType;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        procedureName: string | null;
        price: string | null;
        anamnesisId: string | null;
    }>;
    getDetail(id: string): Promise<({
        patient: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            fullName: string;
            phone: string;
            cpf: string | null;
            birthDate: Date | null;
            address: string | null;
            city: string | null;
            uf: string | null;
        };
        anamnesis: {
            id: string;
            createdAt: Date;
            patientId: string;
            data: import("@prisma/client/runtime/client").JsonValue;
            capturedBy: string | null;
        } | null;
        professional: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            fullName: string;
            specialty: string | null;
            crm: string | null;
        } | null;
        diagnosis: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            description: string;
        } | null;
        prescription: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            items: import("@prisma/client/runtime/client").JsonValue;
            pdfUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        patientId: string;
        professionalId: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.AppointmentType;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        procedureName: string | null;
        price: string | null;
        anamnesisId: string | null;
    }) | null>;
    finish(id: string, diagnosisDescription: string, prescriptionItems: any): Promise<{
        id: string;
        createdAt: Date;
        appointmentId: string;
        items: import("@prisma/client/runtime/client").JsonValue;
        pdfUrl: string | null;
    }>;
}
declare const _default: AppointmentService;
export default _default;
//# sourceMappingURL=appointmentService.d.ts.map