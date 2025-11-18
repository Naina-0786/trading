import type { Request, Response } from 'express';
export declare const userController: {
    createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    loginUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserReferrals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserWallet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=user.d.ts.map