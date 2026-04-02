interface AIInteractionData {
    patientEmail: string;
    patientName: string;
    patientPhone: string;
    interactionType: 'TRIAGE' | 'SCHEDULING';
    capturedData: any;
    agentName: 'CECILIA' | 'INEZ';
}
declare class AIService {
    handleInteraction(data: AIInteractionData): Promise<{
        id: string;
        createdAt: Date;
        patientId: string;
        data: import("@prisma/client/runtime/client").JsonValue;
        capturedBy: string | null;
    } | {
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
    } | undefined>;
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=aiService.d.ts.map