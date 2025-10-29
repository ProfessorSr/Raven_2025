import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router as authRouter } from './modules/auth/controller.stub';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*', credentials: true }));

app.use('/v0/auth', authRouter);
app.get('/v0/health', (_, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`[raven] API v0 running on http://localhost:${port}`));
