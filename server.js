import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import responseTime from 'response-time';

import { PORT, CORS_ORIGIN, NODE_ENV } from './config';
import { logger } from './configs';
import {
	errorMiddleware,
	morganMiddleware,
	notFound,
	rateLimiter,
} from './middlewares';
import { AuthRoutes, RoleRoutes, UserRoutes } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security & Performance middleware
app.use(rateLimiter);
app.use(compression());
app.use(morganMiddleware);
app.use(responseTime());
app.use(helmet());

// CORS configuration
const corsOptions = {
	origin: CORS_ORIGIN || '*',
	credentials: true,
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Static files
app.use('/public', express.static(path.join(path.resolve(), 'temp_uploads')));
app.use(express.static(path.join(path.resolve(), 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Server is healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// API Routes
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/user', UserRoutes);
app.use('/api/v1/role', RoleRoutes);

app.get('/home', (req, res) => {
	res
		.status(200)
		.json({ success: true, message: `Server is running at port ${PORT}` });
});

// 404 handler
app.use('*', notFound);

// Error handling middleware
app.use(errorMiddleware);

// Ensure temp_uploads folder exists
if (!fs.existsSync('./temp_uploads')) {
	fs.mkdirSync('./temp_uploads', { recursive: true });
	logger.info('temp_uploads folder created!');
}

// Start server
const server = app.listen(PORT || 3003, () => {
	logger.info(`Server is listening at port ${PORT}`);
	logger.info(`Environment: ${NODE_ENV || 'development'}`);
});

// Graceful shutdown handler
const shutdown = signal => {
	logger.info(`Received ${signal}, shutting down gracefully...`);
	server.close(() => {
		logger.info('Server closed. Exiting process.');
		process.exit(0);
	});

	// Forced exit after timeout
	setTimeout(() => {
		logger.error(
			'Could not close connections in time, forcefully shutting down',
		);
		process.exit(1);
	}, 10000);
};

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
	shutdown('unhandledRejection');
});

// Catch uncaught exceptions
process.on('uncaughtException', error => {
	logger.error('Uncaught Exception thrown:', error);
	process.exit(1);
});
