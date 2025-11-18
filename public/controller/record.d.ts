import type { Request, Response } from 'express';
export declare const roiRecordController: {
    createROIRecord(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getROIRecordById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllROIRecords(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateROIRecord(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteROIRecord(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getROIRecordsByUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getROIRecordsByInvestmentId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=record.d.ts.map