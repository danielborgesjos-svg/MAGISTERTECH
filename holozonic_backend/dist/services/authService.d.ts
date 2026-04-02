import { RegisterDTO, LoginDTO } from '../dtos/authDTO';
declare class AuthService {
    register({ email, password, fullName, role }: RegisterDTO): Promise<{
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
    } & {
        id: string;
        email: string;
        password: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login({ email, password }: LoginDTO): Promise<{
        user: {
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
        } & {
            id: string;
            email: string;
            password: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        };
        token: any;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map