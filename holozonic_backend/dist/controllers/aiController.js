"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aiService_1 = __importDefault(require("../services/aiService"));
class AIController {
    async webHook(req, res) {
        try {
            // Basic security check (e.g., API Key)
            const apiKey = req.headers['x-api-key'];
            if (apiKey !== process.env.AI_SECRET_KEY) {
                return res.status(401).json({ error: 'Unauthorized AI Source' });
            }
            const result = await aiService_1.default.handleInteraction(req.body);
            return res.status(201).json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new AIController();
//# sourceMappingURL=aiController.js.map