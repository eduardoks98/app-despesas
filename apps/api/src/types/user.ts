export interface User {
  id: number;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}