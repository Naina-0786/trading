import type { Request, Response } from 'express';
export declare const investmentController: {
    createInvestment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getInvestmentById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllInvestments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateInvestment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteInvestment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getInvestmentDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=invesment.d.ts.map