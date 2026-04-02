"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = __importDefault(require("../controllers/aiController"));
const aiRoutes = (0, express_1.Router)();
// Endpoint for Cecilia/Inez to feed the system
aiRoutes.post('/integration', aiController_1.default.webHook);
exports.default = aiRoutes;
//# sourceMappingURL=aiRoutes.js.map