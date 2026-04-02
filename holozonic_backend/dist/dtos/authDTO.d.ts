export interface RegisterDTO {
    email: string;
    password: string;
    fullName: string;
    role?: 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';
}
export interface LoginDTO {
    email: string;
    password: string;
}
//# sourceMappingURL=authDTO.d.ts.map