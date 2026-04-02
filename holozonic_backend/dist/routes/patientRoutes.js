"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patientController_1 = __importDefault(require("../controllers/patientController"));
const auth_1 = require("../middlewares/auth");
const patientRoutes = (0, express_1.Router)();
// Only ADMIN and PROFESSIONAL can access patient records
patientRoutes.use((0, auth_1.authMiddleware)(['ADMIN', 'PROFESSIONAL']));
patientRoutes.get('/', patientController_1.default.index);
patientRoutes.get('/:id', patientController_1.default.show);
patientRoutes.put('/:id', patientController_1.default.update);
exports.default = patientRoutes;
//# sourceMappingURL=patientRoutes.js.map