import type { Request, Response } from 'express';
export declare const transferController: {
    createTransfer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransferById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAllTransfers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTransfer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteTransfer(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransfersBySenderId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTransfersByReceiverId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=transfer.d.ts.map