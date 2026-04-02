import { Request, Response } from 'express';
import aiService from '../services/aiService';

class AIController {
  async webHook(req: Request, res: Response) {
    try {
      // Basic security check (e.g., API Key)
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== process.env.AI_SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized AI Source' });
      }

      const result = await aiService.handleInteraction(req.body);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new AIController();
