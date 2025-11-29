const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "https://www.expotradex.com",
    "https://expo-trading-admin.vercel.app"
];
export const corsMiddleware = (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
};
//# sourceMappingURL=cors.js.map