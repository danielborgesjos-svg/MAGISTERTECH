import { Request, Response } from 'express';
import patientService from '../services/patientService';

class PatientController {
  async index(req: Request, res: Response) {
    try {
      const patients = await patientService.listAll();
      return res.json(patients);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patient = await patientService.getDetail(id as string);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      return res.json(patient);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patient = await patientService.update(id as string, req.body);
      return res.json(patient);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new PatientController();
