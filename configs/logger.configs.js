import path from 'path';

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Custom colors for different log levels (more vibrant in console)
winston.addColors({
	error: 'bold red',
	warn: 'bold yellow',
	info: 'bold green',
	debug: 'bold blue',
});

const logDir = path.join(process.cwd(), 'logs');

const createLevelTransport = level =>
	new DailyRotateFile({
		filename: `${level}-%DATE%.log`,
		dirname: path.join(logDir, level),
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		maxSize: '20m',
		maxFiles: '30d',
		level,
	});

const logFormat = winston.format.printf(
	({ level, message, timestamp, stack }) =>
		`${timestamp} [${level.toUpperCase()}]: ${stack || message}`,
);

export const logger = winston.createLogger({
	level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
	format: winston.format.combine(
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		winston.format.errors({ stack: true }),
		winston.format.splat(),
		winston.format.json(),
	),
	transports: [
		createLevelTransport('error'),
		createLevelTransport('warn'),
		createLevelTransport('info'),
		createLevelTransport('debug'),
		new winston.transports.Console({
			format: winston.format.combine(
				// Colorize the entire log line in console
				winston.format.colorize({ all: true }),
				winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				logFormat,
			),
		}),
	],
	exceptionHandlers: [
		new DailyRotateFile({
			filename: 'exceptions-%DATE%.log',
			dirname: path.join(logDir, 'exceptions'),
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '30d',
		}),
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize({ all: true }),
				winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				logFormat,
			),
		}),
	],
	rejectionHandlers: [
		new DailyRotateFile({
			filename: 'rejections-%DATE%.log',
			dirname: path.join(logDir, 'rejections'),
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '30d',
		}),
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize({ all: true }),
				winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				logFormat,
			),
		}),
	],
});
