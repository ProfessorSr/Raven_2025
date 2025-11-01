import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { router as authRouter } from './modules/auth/controller.stub';
import { router as formsRouter } from './modules/forms/controller';
import { router as profilesRouter } from './modules/profiles/controller';
import { router as adminRouter } from './modules/admin/formFields.controller';
import customFormsRouter from './modules/forms/customForms.controller';
import pagesRouter from './modules/pages/pages.controller';

console.log('[raven] Starting API service...');

const app = express();

app.use(morgan('dev'));

// Core middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.WEB_URL || 'http://localhost:3000',
];

const corsConfig = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token', 'Accept'],
  credentials: true,
};

app.use(cors(corsConfig));
app.options('*', cors(corsConfig));

// Routers
app.use('/v0', authRouter);            // /v0/auth/*
app.use('/v0/auth', authRouter);
app.use('/v0', formsRouter);           // /v0/form/*
app.use('/v0', profilesRouter);        // /v0/profile
app.use('/v0', adminRouter);           // /v0/admin/form-fields
app.use('/v0', customFormsRouter);     // /v0/admin/forms, /v0/form/:slug, etc.
app.use('/v0', pagesRouter);           // /v0/admin/pages and /v0/pages/:slug

// Healthcheck
app.get('/v0/health', (_, res) => {
  res.json({
    status: 'ok',
    version: 'v0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`\n🚀 [raven] API v0 ready at http://localhost:${port}\n`);
});
