import express from 'express';
import cors from 'cors';

import connectDb from './configs/db.js';
import "dotenv/config";


const app = express();
const PORT = process.env.PORT || 3000;


await connectDb();

app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use("/uploads", express.static("uploads"));



app.get('/', (req, res) => {
    res.send('Server is running');
});

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});



server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});