import express from "express";
import errorMiddleware from "./middleware/error.middleware.js";
import investmentRoutes from "./routes/investment.routes.js";
import roiRecordRoutes from "./routes/recore.routes.js";
import referralRoutes from "./routes/refferel.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdraw.routes.js";
import cors from "cors";
const app = express();
app.use(cors({
    origin: "http://localhost:8080",
    credentials: true,
}));
app.use(express.json());
app.use(express.static("src/views"));
app.get("/", (req, res) => {
    return res.sendFile("index.html", { root: "src/views" });
});
// routes
app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdraw', withdrawalRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/record', roiRecordRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/transfer', transferRoutes);
// app.use('/api/settings', settingsRoutes);
app.use(errorMiddleware);
app.listen(4000, () => {
    console.log("Server is running on port 4000");
});
//# sourceMappingURL=index.js.map