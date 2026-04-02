"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appointmentService_1 = __importDefault(require("../services/appointmentService"));
class AppointmentController {
    async index(req, res) {
        try {
            const appointments = await appointmentService_1.default.listAll(req.query);
            return res.json(appointments);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async store(req, res) {
        try {
            const appointment = await appointmentService_1.default.create(req.body);
            return res.status(201).json(appointment);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async show(req, res) {
        try {
            const { id } = req.params;
            const appointment = await appointmentService_1.default.getDetail(id);
            if (!appointment)
                return res.status(404).json({ error: 'Appointment not found' });
            return res.json(appointment);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const appointment = await appointmentService_1.default.updateStatus(id, status);
            return res.json(appointment);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
    async finish(req, res) {
        try {
            const { id } = req.params;
            const { description, prescriptionItems } = req.body;
            const appointment = await appointmentService_1.default.finish(id, description, prescriptionItems);
            return res.json(appointment);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new AppointmentController();
//# sourceMappingURL=appointmentController.js.map