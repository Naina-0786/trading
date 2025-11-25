import { Router } from "express";
import paymentController from "../controller/payment.js";
const paymentRoutes = Router();
const verifypaymentRoutes = Router();
paymentRoutes.post("/checkout", paymentController.createCharge);
verifypaymentRoutes.post("/webhook", paymentController.verifypayment);
export default paymentRoutes;
//# sourceMappingURL=payment.routes.js.map