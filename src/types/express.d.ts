import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        roleName: string;
      } & JwtPayload;
    }
  }
}
