declare class PatientService {
    listAll(): Promise<({
        user: {
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
        _count: {
            appointments: number;
        };
    } & {
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
    })[]>;
    getDetail(id: string): Promise<({
        user: {
            email: string;
        };
        appointments: ({
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
        })[];
        anamneses: {
            id: string;
            createdAt: Date;
            patientId: string;
            data: import("@prisma/client/runtime/client").JsonValue;
            capturedBy: string | null;
        }[];
    } & {
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
    }) | null>;
    update(id: string, data: any): Promise<{
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
    }>;
}
declare const _default: PatientService;
export default _default;
//# sourceMappingURL=patientService.d.ts.map