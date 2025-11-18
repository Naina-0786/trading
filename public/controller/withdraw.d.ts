import type { Request, Response } from 'express';
export declare const withdrawalController: {
    createWithdrawal(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getWithdrawalById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllWithdrawals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateWithdrawal(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteWithdrawal(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getWithdrawalsByUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=withdraw.d.ts.map