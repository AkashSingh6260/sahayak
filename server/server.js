import express from 'express';
import cors from 'cors';
import http from 'http';
import connectDb from './configs/db.js';
import "dotenv/config";
import userRouter from './routes/UserRoutes.js';
import PartnerRouter from './routes/PartnerRoutes.js';
import AdminRouter from './routes/AdminRoutes.js';
import ServiceRouter from './routes/ServiceRoutes.js';
import NotificationRouter from './routes/NotificationRoutes.js';
import RequestRouter from './routes/RequestRoutes.js';
import OrderRouter from './routes/OrderRoutes.js';
import WalletRouter from './routes/WalletRoutes.js';
import PaymentRouter from './routes/PaymentRoutes.js';
import SOSRouter from './routes/SOSRoutes.js';
import { initWSS } from './socket.js';

import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;


const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true, 
    legacyHeaders: false, 
});
app.use("/api", apiLimiter);


await connectDb();

app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Static folder for uploaded files
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", userRouter);
app.use("/api/partners", PartnerRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/services", ServiceRouter);
app.use("/api/notifications", NotificationRouter);
app.use("/api/requests", RequestRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/wallet", WalletRouter);
app.use("/api/payments", PaymentRouter);
app.use("/api/sos", SOSRouter);


app.get('/', (req, res) => {
    res.send('Server is running');
});


app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});


app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Unhandled Error:', err.stack);
    } else {
        console.error('❌ Unhandled Error:', err.message);
    }
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        message: err.message || 'Internal Server Error',
    });
});


const server = http.createServer(app);


initWSS(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});