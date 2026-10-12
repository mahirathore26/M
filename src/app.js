import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'freight-rate-engine' });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const CLIENT_ERROR_MESSAGES = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
};

// Centralized error handler
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const isClientError = Number.isInteger(err.status) && err.status >= 400 && err.status < 500;
  const status = isClientError ? err.status : 500;

  if (status === 500) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  const hasPublicMessage = typeof err.publicMessage === 'string' && err.publicMessage.trim() !== '';
  const message = hasPublicMessage
    ? err.publicMessage
    : (CLIENT_ERROR_MESSAGES[status] ?? 'Bad request');

  res.status(status).json({ error: message });
}

app.use(errorHandler);

export default app;