import type { Request, Response } from 'express';
export declare const subscriptionPlanController: {
    createSubscriptionPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSubscriptionPlanById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllSubscriptionPlans(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateSubscriptionPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteSubscriptionPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSubscriptionPlanInvestments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=subscriptoin.d.ts.map