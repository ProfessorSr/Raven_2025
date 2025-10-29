import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router as authRouter } from './modules/auth/controller.stub';
import { router as formsRouter } from './modules/forms/controller';

const app = express();

// Core middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

// Routers
app.use('/v0/form', formsRouter);
app.use('/v0/auth', authRouter);

// Healthcheck
app.get('/v0/health', (_, res) => res.json({ status: 'ok' }));

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`[raven] API v0 running on http://localhost:${port}`)
);
