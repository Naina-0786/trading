import { z } from "zod";
export declare const createEnquirySchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    subject: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export declare const enquiryIdSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type EnquiryIdInput = z.infer<typeof enquiryIdSchema>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type PaginationInput = z.infer<typeof paginationSchema>;
//# sourceMappingURL=enquiry.d.ts.map