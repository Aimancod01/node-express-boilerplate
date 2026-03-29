import morgan from 'morgan';

import { logger } from '../configs';

const stream = {
	write: message => logger.info(message.trim()),
};

const skip = () => process.env.NODE_ENV === 'test';

export const morganMiddleware = morgan(
	':method :url :status :res[content-length] - :response-time ms',
	{ stream, skip },
);
