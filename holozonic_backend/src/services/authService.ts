import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { RegisterDTO, LoginDTO } from '../dtos/authDTO';

class AuthService {
  async register({ email, password, fullName, role }: RegisterDTO) {
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (userExists) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 8);

    const user = await prisma.user.create({
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

  async login({ email, password }: LoginDTO) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { patient: true, professional: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new Error('Incorrect password');
    }

    // @ts-ignore
    const token = (jwt as any).sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return { user, token };
  }
}

export default new AuthService();
