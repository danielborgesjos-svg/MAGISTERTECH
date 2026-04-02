import { Request, Response } from 'express';
declare class PatientController {
    index(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    show(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: PatientController;
export default _default;
//# sourceMappingURL=patientController.d.ts.map