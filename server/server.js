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
import { initWSS } from './socket.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
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

// Home route
app.get('/',(req,res)=>{
    res.send('Server is running');
});

// 404 — Not Found
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler (must have 4 args to be recognised by Express)
// eslint-disable-next-line no-unused-vars
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

// Create HTTP server (wraps Express) so WebSocket can share the same port
const server = http.createServer(app);

// Attach WebSocket server
initWSS(server);

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
});