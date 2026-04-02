import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export function authMiddleware(roles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const [, token] = authHeader.split(' ');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as TokenPayload;
      
      // Store user info in request
      req.user = {
        id: decoded.id,
        role: decoded.role
      };

      // Check roles if specified
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Operation not permitted for this role' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalid' });
    }
  };
}
