import type { Request, Response } from "express";
export declare const getAllSupportTickets: (req: any, res: any) => Promise<void>;
export declare const getSupportTicketById: (req: any, res: any) => Promise<any>;
export declare const getSupportTicketsByUserId: (req: any, res: any) => Promise<void>;
export declare const createSupportTicket: (req: any, res: any) => Promise<any>;
export declare const updateSupportTicket: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSupportTicket: (req: any, res: any) => Promise<any>;
//# sourceMappingURL=support.d.ts.map