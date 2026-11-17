import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

config();

import { connect } from './sails-client.mjs';
import { migrate } from './services/db.mjs';
import { ensureVoucherTable } from './services/voucher-service.mjs';
import { ensureAgentSocietySchema, startAutonomousAgentWorker } from '../../agents/runtime/index.mjs';
import healthRouter from './routes/health.mjs';
import streamsRouter from './routes/streams.mjs';
import vaultRouter from './routes/vault.mjs';
import splitsRouter from './routes/splits.mjs';
import permissionsRouter from './routes/permissions.mjs';
import bountyRouter from './routes/bounty.mjs';
import bountiesDbRouter from './routes/bounties_db.mjs';
import identityRouter from './routes/identity.mjs';
import growTokenRouter from './routes/grow-token.mjs';
import campaignRouter from './routes/campaign.mjs';
import webhooksRouter from './routes/webhooks.mjs';
import leaderboardRouter from './routes/leaderboard.mjs';
import usersRouter from './routes/users.mjs';
import voucherRouter from './routes/voucher.mjs';
import agenticRouter from './routes/agentic/index.mjs';
import agentsRouter from './routes/agents.mjs';
import protocolOverviewRouter from './routes/protocol-overview.mjs';
import { startStream as startXStream } from './services/x-agent.mjs';
import { startIndexer } from './services/chain-indexer.service.mjs';
import { initCrons } from './cron/index.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    strictTransportSecurity: false,
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('short'));

// Raw body parser for GitHub webhook HMAC verification (MUST be before express.json())
app.use('/api/webhooks/github', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/streams', streamsRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/splits', splitsRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/bounty', bountyRouter);
app.use('/api/bounties', bountiesDbRouter);
app.use('/api/identity', identityRouter);
app.use('/api/grow-token', growTokenRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/users', usersRouter);
app.use('/api/voucher', voucherRouter);
app.use('/api/agentic', agenticRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/protocol-overview', protocolOverviewRouter);
app.use('/api/analytics', protocolOverviewRouter);
app.get('/protocol-overview', (req, res) => res.redirect('/api/protocol-overview/ui?tab=overview'));
app.get('/dashboard', (req, res) => res.redirect('/api/protocol-overview/ui?tab=overview'));
app.get('/defillama', (req, res) => res.redirect('/api/protocol-overview/ui?tab=defillama'));
app.get('/wallets', (req, res) => res.redirect('/api/protocol-overview/ui?tab=wallets'));
app.get('/agentic', (req, res) => res.redirect('/api/protocol-overview/ui?tab=agentic'));
app.get('/trade', (req, res) => res.redirect('/api/protocol-overview/ui?tab=trade'));
app.get('/markets', (req, res) => res.redirect('/api/protocol-overview/ui?tab=trade'));
app.get('/streams', (req, res) => res.redirect('/api/protocol-overview/ui?tab=streams'));
app.get('/bounty', (req, res) => res.redirect('/api/protocol-overview/ui?tab=bounty'));
app.get('/campaigns', (req, res) => res.redirect('/api/protocol-overview/ui?tab=bounty'));
app.get('/app', (req, res) => res.redirect('/api/protocol-overview/ui?tab=overview'));

app.get('/', (req, res) => {
  const accept = String(req.headers.accept || '');
  if (accept.includes('text/html')) {
    return res.redirect('/api/protocol-overview/ui?tab=overview');
  }
  res.json({
    name: 'GrowStreams V3 + Society of AI Agents (ACP) API',
    version: '3.1.0',
    network: 'vara-mainnet (wss://rpc.vara.network)',
    description: 'Money streaming infrastructure & Autonomous Society of AI Agents on Vara Network',
    dashboardUrl: 'http://localhost:3001/protocol-overview',
    frontendAppUrl: 'http://localhost:3000',
    endpoints: {
      protocolOverview: {
        htmlUi: 'GET /protocol-overview',
        json: 'GET /api/protocol-overview',
        defiLlama: 'GET /api/protocol-overview/defillama',
        walletsJson: 'GET /api/protocol-overview/wallets',
        walletsCsv: 'GET /api/protocol-overview/wallets/csv',
      },
      agentSociety: {
        templates: 'GET /api/agents/templates',
        stats: 'GET /api/agents/stats',
        society: 'GET /api/agents/society?ownerWallet=&templateType=',
        spawn: 'POST /api/agents/spawn { ownerWallet, ownerHandle?, mode? }',
        hireAcp: 'POST /api/agents/acp/hire { requesterWallet, ownerWallet?, title?, prompt?, budgetVara?, mode? }',
        jobs: 'GET /api/agents/acp/jobs',
        tick: 'POST /api/agents/acp/tick',
      },
      voucher: {
        request: 'POST /api/voucher/request { wallet }',
        status: 'GET /api/voucher/status/:wallet',
      },
    },
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  console.error(`[error] ${req.method} ${req.path}: ${message}`);
  res.status(status).json({ error: message });
});

async function start() {
  try {
    // Run database migrations (creates tables if not exist)
    try {
      await migrate();
      await ensureVoucherTable();
    } catch (dbErr) {
      console.warn(`[db] Migration warning: ${dbErr.message}`);
    }

    try {
      await ensureAgentSocietySchema();
    } catch (agentDbErr) {
      console.warn(`[agents] Schema setup note: ${agentDbErr.message}`);
    }

    // Port 3000 is reserved for the Next.js frontend application (frontend/)
    if (String(process.env.BIND_PORT_3000 || 'false') === 'true' && Number(PORT) !== 3000) {
      const uiServer = app.listen(3000, '0.0.0.0', () => {
        console.log(`[ui] GrowStreams API fallback also listening on http://localhost:3000`);
      });
      uiServer.on('error', (e) => {
        console.warn(`[ui] Port 3000 note: ${e.message}`);
      });
    }

    app.listen(PORT, '0.0.0.0', async () => {
      console.log(`[api] GrowStreams V3 + Agent Society API listening on port ${PORT}`);
      console.log(`[api] http://localhost:${PORT}`);

      try {
        await connect();
      } catch (sailsErr) {
        console.warn(`[sails] Warning: Failed to connect to Vara: ${sailsErr.message}`);
      }

      // Start campaign cron jobs
      try {
        initCrons();
      } catch (err) {
        console.warn(`[cron] Failed to initialize: ${err.message}`);
      }

      // Start Autonomous Vara Agent Society worker
      try {
        startAutonomousAgentWorker();
      } catch (err) {
        console.warn(`[agents] Worker start warning: ${err.message}`);
      }

      // Start X/Twitter filtered stream (non-blocking, server runs even if this fails)
      try {
        await startXStream();
      } catch (err) {
        console.warn(`[x-agent] Failed to start: ${err.message}`);
      }

      // Start Agentic Chain Indexer
      try {
        await startIndexer();
      } catch (err) {
        console.warn(`[indexer] Failed to start: ${err.message}`);
      }

      // Start In-Built Server Runtime Scheduler for User-Spawned AI Agent Squads
      try {
        const { syncAllSquadsIntoScheduler, startAutonomousAgentWorker } = await import('../../agents/runtime/index.mjs');
        await syncAllSquadsIntoScheduler();
        startAutonomousAgentWorker(60 * 1000);
      } catch (err) {
        console.warn(`[agents/scheduler] Failed to start: ${err.message}`);
      }
    });
  } catch (err) {
    console.error('[fatal]', err.message);
  }
}

start();
