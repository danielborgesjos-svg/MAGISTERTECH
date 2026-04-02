import { Request, Response } from 'express';
import consultationService from '../services/consultationService';

class ConsultationController {
  async finalize(req: Request, res: Response) {
    try {
      const result = await consultationService.finalize(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new ConsultationController();
