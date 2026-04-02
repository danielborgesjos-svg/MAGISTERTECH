import { Request, Response, NextFunction } from 'express';
export declare function authMiddleware(roles?: string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map