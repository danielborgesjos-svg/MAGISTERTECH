"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
class AuthController {
    async register(req, res) {
        try {
            const user = await authService_1.default.register(req.body);
            return res.status(201).json(user);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async login(req, res) {
        try {
            const { user, token } = await authService_1.default.login(req.body);
            return res.json({ user, token });
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map