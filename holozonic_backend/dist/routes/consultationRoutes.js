"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const consultationController_1 = __importDefault(require("../controllers/consultationController"));
const auth_1 = require("../middlewares/auth");
const consultationRoutes = (0, express_1.Router)();
// Only PROFESSIONALS can finalize consultations
consultationRoutes.post('/finalize', (0, auth_1.authMiddleware)(['PROFESSIONAL']), consultationController_1.default.finalize);
exports.default = consultationRoutes;
//# sourceMappingURL=consultationRoutes.js.map