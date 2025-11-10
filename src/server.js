import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import medecinRoutes from './routes/medecin.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeWebSocket } from './services/websocketService.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/medecin', medecinRoutes);
app.use('/admin', adminRoutes);
app.use('/public', publicRoutes);

app.get('/', (req, res) => {
  res.status(200).send('API is running');
});

// Initialize WebSocket server
initializeWebSocket(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
