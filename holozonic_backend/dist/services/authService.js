"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
class AuthService {
    async register({ email, password, fullName, role }) {
        const userExists = await prisma_1.default.user.findUnique({ where: { email } });
        if (userExists) {
            throw new Error('User already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 8);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: passwordHash,
                role: role || 'PATIENT',
                [role === 'PROFESSIONAL' ? 'professional' : 'patient']: {
                    create: {
                        fullName,
                        phone: '', // Can be updated later
                    }
                }
            },
            include: {
                patient: true,
                professional: true
            }
        });
        return user;
    }
    async login({ email, password }) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { patient: true, professional: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            throw new Error('Incorrect password');
        }
        // @ts-ignore
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        return { user, token };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map