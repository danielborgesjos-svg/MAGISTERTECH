"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const consultationService_1 = __importDefault(require("../services/consultationService"));
class ConsultationController {
    async finalize(req, res) {
        try {
            const result = await consultationService_1.default.finalize(req.body);
            return res.status(201).json(result);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new ConsultationController();
//# sourceMappingURL=consultationController.js.map