"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(roles = []) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token not provided' });
        }
        const [, token] = authHeader.split(' ');
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            // Store user info in request
            req.user = {
                id: decoded.id,
                role: decoded.role
            };
            // Check roles if specified
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                return res.status(403).json({ error: 'Operation not permitted for this role' });
            }
            return next();
        }
        catch (err) {
            return res.status(401).json({ error: 'Token invalid' });
        }
    };
}
//# sourceMappingURL=auth.js.map