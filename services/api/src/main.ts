import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router as authRouter } from './modules/auth/controller.stub';
import { router as formsRouter } from './modules/forms/controller';
import { router as profilesRouter } from './modules/profiles/controller';

const app = express();

// Core middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000'];
      if (!origin || allowed.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true,
  })
);

// Routers
app.use('/v0/form', formsRouter);
app.use('/v0/auth', authRouter);
app.use('/v0/profile', profilesRouter);

// Healthcheck
app.get('/v0/health', (_, res) => res.json({ status: 'ok' }));

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`[raven] API v0 running on http://localhost:${port}`)
);
