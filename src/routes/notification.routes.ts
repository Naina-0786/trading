import { Router } from "express";
import { createNotification, getAllNotifications } from "../controller/admin/notification.js";

const notificationRoutes = Router();

notificationRoutes.post("/create", createNotification);
notificationRoutes.get("/all", getAllNotifications);

export default notificationRoutes;