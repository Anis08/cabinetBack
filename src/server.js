import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import medecinRoutes from './routes/medecin.js';
import adminRoutes from './routes/admin.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';


dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/medecin', medecinRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.status(200).send('API is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
