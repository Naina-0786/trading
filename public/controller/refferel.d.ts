import type { Request, Response } from 'express';
export declare const referralController: {
    createReferral(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getReferralById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllReferrals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateReferral(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteReferral(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getReferralsByReferrerId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getReferralsByReferredUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=refferel.d.ts.map