import { Request, Response } from 'express';
declare class AppointmentController {
    index(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    store(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    show(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    finish(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AppointmentController;
export default _default;
//# sourceMappingURL=appointmentController.d.ts.map