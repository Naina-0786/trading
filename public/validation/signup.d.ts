import zod from "zod";
export declare const UserSchema: zod.ZodObject<{
    fullName: zod.ZodString;
    email: zod.ZodString;
    country: zod.ZodString;
    Phonenumber: zod.ZodString;
    password: zod.ZodString;
    refelerCode: zod.ZodOptional<zod.ZodString>;
}, zod.z.core.$strip>;
//# sourceMappingURL=signup.d.ts.map