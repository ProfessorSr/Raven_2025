import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { router as authRouter } from './modules/auth/controller.stub';
import { router as formsRouter } from './modules/forms/controller';
import { router as profilesRouter } from './modules/profiles/controller';
import { router as adminRouter } from './modules/admin/formFields.controller';

const app = express();

// Core middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token', 'Accept'], // <- add Accept here
    credentials: true,
  })
);

// Handle preflight requests quickly
app.options(
  '*',
  cors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token', 'Accept'], // <- and here
    credentials: true,
  })
);

// Routers
app.use('/v0/form', formsRouter);
app.use('/v0/auth', authRouter);
app.use('/v0/profile', profilesRouter);
app.use('/v0/admin', adminRouter);

// Healthcheck
app.get('/v0/health', (_, res) => res.json({ status: 'ok' }));

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`[raven] API v0 running on http://localhost:${port}`)
);
