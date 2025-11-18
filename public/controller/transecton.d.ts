import type { Request, Response } from 'express';
export declare const transactionController: {
    createTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransactionById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteTransaction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransactionsByUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransactionsByInvestmentId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=transecton.d.ts.map