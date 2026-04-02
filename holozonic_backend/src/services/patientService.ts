import prisma from '../lib/prisma';

class PatientService {
  async listAll() {
    return await prisma.patient.findMany({
      include: {
        user: { select: { email: true, role: true } },
        _count: { select: { appointments: true } }
      },
      orderBy: { fullName: 'asc' }
    });
  }

  async getDetail(id: string) {
    return await prisma.patient.findUnique({
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

  async update(id: string, data: any) {
    return await prisma.patient.update({
      where: { id },
      data
    });
  }
}

export default new PatientService();
