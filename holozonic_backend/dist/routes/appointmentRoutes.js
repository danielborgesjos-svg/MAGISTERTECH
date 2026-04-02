"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointmentController_1 = __importDefault(require("../controllers/appointmentController"));
const auth_1 = require("../middlewares/auth");
const appointmentRoutes = (0, express_1.Router)();
// Protected routes (Admin and Professionals)
appointmentRoutes.use((0, auth_1.authMiddleware)(['ADMIN', 'PROFESSIONAL']));
appointmentRoutes.get('/', appointmentController_1.default.index);
appointmentRoutes.post('/', appointmentController_1.default.store);
appointmentRoutes.get('/:id', appointmentController_1.default.show);
appointmentRoutes.patch('/:id/status', appointmentController_1.default.updateStatus);
appointmentRoutes.post('/:id/finish', appointmentController_1.default.finish);
exports.default = appointmentRoutes;
//# sourceMappingURL=appointmentRoutes.js.map