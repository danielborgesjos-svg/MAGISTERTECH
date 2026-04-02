"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const patientService_1 = __importDefault(require("../services/patientService"));
class PatientController {
    async index(req, res) {
        try {
            const patients = await patientService_1.default.listAll();
            return res.json(patients);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async show(req, res) {
        try {
            const { id } = req.params;
            const patient = await patientService_1.default.getDetail(id);
            if (!patient)
                return res.status(404).json({ error: 'Patient not found' });
            return res.json(patient);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const patient = await patientService_1.default.update(id, req.body);
            return res.json(patient);
        }
        catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}
exports.default = new PatientController();
//# sourceMappingURL=patientController.js.map