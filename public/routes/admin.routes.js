import express from "express";
import { deleteAdmin, getAllAdmins, loginAdmin, registerAdmin } from "../controller/admin/admin.js";
const router = express.Router();
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/", getAllAdmins);
router.delete("/:id", deleteAdmin);
export default router;
//# sourceMappingURL=admin.routes.js.map