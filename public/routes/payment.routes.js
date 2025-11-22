import { Router } from "express";
import paymentController from "../controller/payment.js";
const paymentRoutes = Router();
paymentRoutes.post("/checkout", paymentController.createCharge);
export default paymentRoutes;
//# sourceMappingURL=payment.routes.js.map