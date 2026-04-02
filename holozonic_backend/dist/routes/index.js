"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const aiRoutes_1 = __importDefault(require("./aiRoutes"));
const patientRoutes_1 = __importDefault(require("./patientRoutes"));
const appointmentRoutes_1 = __importDefault(require("./appointmentRoutes"));
const consultationRoutes_1 = __importDefault(require("./consultationRoutes"));
const routes = (0, express_1.Router)();
// Auth Routes
routes.use('/auth', authRoutes_1.default);
// AI Integration Routes (Webhook)
routes.use('/ai', aiRoutes_1.default);
// Patient Management
routes.use('/patients', patientRoutes_1.default);
// Appointments & Agenda
routes.use('/appointments', appointmentRoutes_1.default);
// Consultations (Diagnosis & Prescriptions)
routes.use('/consultations', consultationRoutes_1.default);
exports.default = routes;
//# sourceMappingURL=index.js.map