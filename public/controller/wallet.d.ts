import type { Request, Response } from 'express';
export declare const walletController: {
    createWallet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getWalletByUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateWallet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteWallet(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=wallet.d.ts.map