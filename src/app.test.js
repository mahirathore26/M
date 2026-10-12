import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import app, { errorHandler } from './app.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listen(expressApp) {
  return new Promise((resolve) => {
    const srv = http.createServer(expressApp);
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function close(srv) {
  return new Promise((resolve) => srv.close(resolve));
}

async function get(srv, path) {
  const { port } = srv.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const body = await res.json();
  return { status: res.status, body };
}

// ---------------------------------------------------------------------------
// Tests against the real exported app (health + 404)
// ---------------------------------------------------------------------------

let appServer;
before(async () => { appServer = await listen(app); });
after(async () => close(appServer));

describe('GET /api/health', () => {
  it('returns 200 with health payload', async () => {
    const { status, body } = await get(appServer, '/api/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'freight-rate-engine');
  });
});

describe('404 handler', () => {
  it('returns 404 with Not found for unknown routes', async () => {
    const { status, body } = await get(appServer, '/no-such-route');
    assert.equal(status, 404);
    assert.equal(body.error, 'Not found');
  });
});

// ---------------------------------------------------------------------------
// Tests for the centralized errorHandler using the imported function
// ---------------------------------------------------------------------------

function makeErrorApp(thrower) {
  const a = express();
  a.get('/boom', (_req, _res, next) => next(thrower()));
  a.use(errorHandler);
  return a;
}

describe('error handler', () => {
  it('returns 500 with generic message and hides internal details for unexpected errors', async () => {
    const srv = await listen(makeErrorApp(() => new Error('SECRET db conn string')));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 500);
      assert.equal(body.error, 'Internal server error');
      assert.ok(!JSON.stringify(body).includes('SECRET'));
    } finally {
      await close(srv);
    }
  });

  it('returns explicitly approved publicMessage for 4xx errors', async () => {
    const srv = await listen(makeErrorApp(() => {
      const err = new Error('SECRET internal trace detail');
      err.status = 404;
      err.publicMessage = 'Load not found';
      return err;
    }));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 404);
      assert.equal(body.error, 'Load not found');
      assert.ok(!JSON.stringify(body).includes('SECRET'));
    } finally {
      await close(srv);
    }
  });

  it('hides secret err.message on 4xx errors and returns safe generic status message when publicMessage is absent', async () => {
    const srv = await listen(makeErrorApp(() => {
      const err = new Error('SECRET internal query failure details');
      err.status = 404;
      return err;
    }));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 404);
      assert.equal(body.error, 'Not found');
      assert.ok(!JSON.stringify(body).includes('SECRET'));
    } finally {
      await close(srv);
    }
  });

  it('hides secret err.message and falls back to generic status message when publicMessage is whitespace only', async () => {
    const srv = await listen(makeErrorApp(() => {
      const err = new Error('SECRET schema detail');
      err.status = 400;
      err.publicMessage = '   ';
      return err;
    }));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 400);
      assert.equal(body.error, 'Bad request');
      assert.ok(!JSON.stringify(body).includes('SECRET'));
    } finally {
      await close(srv);
    }
  });

  it('falls back to 500 when err.status is not a valid integer', async () => {
    const srv = await listen(makeErrorApp(() => {
      const err = new Error('should be hidden');
      err.status = 'not-a-number';
      return err;
    }));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 500);
      assert.equal(body.error, 'Internal server error');
    } finally {
      await close(srv);
    }
  });

  it('falls back to 500 when err.status is a server-error code', async () => {
    const srv = await listen(makeErrorApp(() => {
      const err = new Error('gateway timeout detail');
      err.status = 503;
      err.publicMessage = 'Service unavailable';
      return err;
    }));
    try {
      const { status, body } = await get(srv, '/boom');
      assert.equal(status, 500);
      assert.equal(body.error, 'Internal server error');
      assert.ok(!JSON.stringify(body).includes('gateway'));
    } finally {
      await close(srv);
    }
  });
});
