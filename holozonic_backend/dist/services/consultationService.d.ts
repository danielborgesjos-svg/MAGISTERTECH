interface ConsultationData {
    appointmentId: string;
    diagnosis: string;
    prescriptionItems: any[];
}
declare class ConsultationService {
    finalize(data: ConsultationData): Promise<{
        diag: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            description: string;
        };
        presc: {
            id: string;
            createdAt: Date;
            appointmentId: string;
            items: import("@prisma/client/runtime/client").JsonValue;
            pdfUrl: string | null;
        };
    }>;
}
declare const _default: ConsultationService;
export default _default;
//# sourceMappingURL=consultationService.d.ts.map