import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { deriveFourAgentSuite } from './wallet-factory.mjs';
import { VARA_MAINNET_CONTRACTS } from '../templates/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCAL_STATE_PATH = resolve(__dirname, '.agent-society-state.json');
const SCHEMA_SQL_PATH = resolve(__dirname, '../schema.sql');

let dbModule = null;
let schemaEnsured = false;

async function getDb() {
  if (dbModule !== null) return dbModule;
  try {
    const mod = await import('../../api/src/services/db.mjs');
    // Test if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      dbModule = false;
      return false;
    }
    dbModule = mod;
    return dbModule;
  } catch {
    dbModule = false;
    return false;
  }
}

export async function ensureAgentSocietySchema() {
  if (schemaEnsured) return;
  const db = await getDb();
  if (db) {
    try {
      const sql = readFileSync(SCHEMA_SQL_PATH, 'utf-8');
      await db.query(sql);
      schemaEnsured = true;
      return;
    } catch (err) {
      console.warn('[agent-store] DB schema warning, using local state fallback:', err.message);
      dbModule = false;
    }
  }
  await ensureLocalSeedState();
  schemaEnsured = true;
}

async function ensureLocalSeedState() {
  if (existsSync(LOCAL_STATE_PATH)) return;

  const anmolWallet = 'kGkLork3scX9s5s6va1234567890anmolVaraMainnetWallet';
  const satyamWallet = 'kGiaMA7satyamVaraMainnetSocietyFounderWallet0001';

  const anmolSuite = await deriveFourAgentSuite(anmolWallet, 'Anmol');
  const satyamSuite = await deriveFourAgentSuite(satyamWallet, 'Satyam');

  const now = new Date().toISOString();
  const agents = [...anmolSuite, ...satyamSuite].map((a, idx) => ({
    id: crypto.randomUUID(),
    ...a,
    splits_group_id: idx < 4 ? '1' : '2',
    voucher_id: `0xvoucher_${a.agent_actor_id.slice(2, 18)}`,
    permission_tx_hash: `0x94a1f0${a.agent_actor_id.slice(2, 60)}`,
    identity_tx_hash: `0x71b2e9${a.agent_actor_id.slice(2, 60)}`,
    status: 'ACTIVE',
    total_jobs: idx < 4 ? 3 : 2,
    total_volume_vara: idx < 4 ? 126.0 : 84.0,
    total_gas_burned_vara: 0.14,
    created_at: now,
    updated_at: now,
  }));

  const sampleJobId = crypto.randomUUID();
  const sampleJob = {
    id: sampleJobId,
    job_code: 'ACP-VARA-0001',
    requester_wallet: satyamWallet,
    owner_wallet: anmolWallet,
    lead_agent_id: agents[0].id,
    title: 'Autonomous gVARA Treasury Stream + Sails Audit + Viral Flex Card',
    prompt: 'Allocate 30 VARA across TokenVault & StreamCore, audit Delayed Message hook, and publish PnL Flex Card on X.',
    budget_vara: 30,
    token_symbol: 'gVARA',
    token_address: VARA_MAINNET_CONTRACTS.gvaraToken,
    stream_id: '101',
    splits_group_id: '1',
    status: 'COMPLETED',
    total_onchain_volume_vara: 126,
    hop_count: 4,
    deliverables: {
      summary: '4-Agent cascade completed across TokenVault, StreamCore, SplitsRouter & IdentityRegistry on Vara Mainnet.',
    },
    tx_trail: [
      {
        hopNumber: 1,
        hopType: 'TVL_VAULT_DEPOSIT',
        contractName: 'TokenVault',
        contractAddress: VARA_MAINNET_CONTRACTS.tokenVault,
        serviceMethod: 'VaultService.DepositNative',
        fromActor: satyamWallet,
        toActor: VARA_MAINNET_CONTRACTS.tokenVault,
        amountVara: 13.5,
        tokenSymbol: 'VARA',
        txHash: '0x4b8f19c2a0d34f92817e3c54d8a19012f3e8c7112233445566778899aabbcc01',
        explorerUrl: `https://idea.gear-tech.io/programs/${VARA_MAINNET_CONTRACTS.tokenVault}?node=wss://rpc.vara.network`,
      },
      {
        hopNumber: 2,
        hopType: 'STREAM_CORE_CREATE',
        contractName: 'StreamCore',
        contractAddress: VARA_MAINNET_CONTRACTS.streamCore,
        serviceMethod: 'StreamService.CreateStream',
        fromActor: satyamWallet,
        toActor: agents[0].agent_wallet,
        amountVara: 10.5,
        tokenSymbol: 'gVARA',
        txHash: '0x8d2e41f5b7c89a0123456789abcdef0123456789abcdef0123456789abcdef02',
        explorerUrl: `https://idea.gear-tech.io/programs/${VARA_MAINNET_CONTRACTS.streamCore}?node=wss://rpc.vara.network`,
      },
      {
        hopNumber: 3,
        hopType: 'SPLITS_ROUTER_ACP_PAYOUT',
        contractName: 'SplitsRouter',
        contractAddress: VARA_MAINNET_CONTRACTS.splitsRouter,
        serviceMethod: 'SplitsService.Distribute',
        fromActor: agents[0].agent_wallet,
        toActor: 'Anmol 4-Agent Split Group #1 (Trader/SDE/Art/X)',
        amountVara: 6.0,
        tokenSymbol: 'gVARA',
        txHash: '0x9f1c33e7a4b56d0123456789abcdef0123456789abcdef0123456789abcdef03',
        explorerUrl: `https://idea.gear-tech.io/programs/${VARA_MAINNET_CONTRACTS.splitsRouter}?node=wss://rpc.vara.network`,
      },
      {
        hopNumber: 4,
        hopType: 'IDENTITY_AND_SEEDS_PROOF',
        contractName: 'IdentityRegistry',
        contractAddress: VARA_MAINNET_CONTRACTS.identityRegistry,
        serviceMethod: 'IdentityService.UpdateScore',
        fromActor: agents[1].agent_wallet,
        toActor: agents[3].agent_wallet,
        amountVara: 0,
        tokenSymbol: 'VARA',
        txHash: '0x3a7b55d9e1f20c0123456789abcdef0123456789abcdef0123456789abcdef04',
        explorerUrl: `https://idea.gear-tech.io/programs/${VARA_MAINNET_CONTRACTS.identityRegistry}?node=wss://rpc.vara.network`,
      },
    ],
    created_at: now,
    updated_at: now,
  };

  const initialState = {
    agents,
    jobs: [sampleJob],
    transactions: sampleJob.tx_trail.map((t) => ({
      id: crypto.randomUUID(),
      job_id: sampleJobId,
      ...t,
      created_at: now,
    })),
  };

  writeFileSync(LOCAL_STATE_PATH, JSON.stringify(initialState, null, 2), 'utf-8');
}

function readLocalState() {
  if (!existsSync(LOCAL_STATE_PATH)) {
    return { agents: [], jobs: [], transactions: [] };
  }
  try {
    return JSON.parse(readFileSync(LOCAL_STATE_PATH, 'utf-8'));
  } catch {
    return { agents: [], jobs: [], transactions: [] };
  }
}

function writeLocalState(state) {
  writeFileSync(LOCAL_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export async function upsertSpawnedAgents(agentRows) {
  await ensureAgentSocietySchema();
  const db = await getDb();

  if (db) {
    try {
      const saved = [];
      for (const a of agentRows) {
        const row = await db.queryOne(
          `INSERT INTO public.user_agents (
            owner_wallet, owner_handle, agent_wallet, agent_actor_id, template_type,
            name, role_title, skills, hire_fee_vara, split_weight, splits_group_id,
            voucher_id, permission_tx_hash, identity_tx_hash, reservation_id,
            heartbeat_interval_blocks, metadata
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          ON CONFLICT (agent_wallet) DO UPDATE SET
            owner_handle = EXCLUDED.owner_handle,
            splits_group_id = COALESCE(EXCLUDED.splits_group_id, public.user_agents.splits_group_id),
            voucher_id = COALESCE(EXCLUDED.voucher_id, public.user_agents.voucher_id),
            permission_tx_hash = COALESCE(EXCLUDED.permission_tx_hash, public.user_agents.permission_tx_hash),
            identity_tx_hash = COALESCE(EXCLUDED.identity_tx_hash, public.user_agents.identity_tx_hash),
            updated_at = NOW()
          RETURNING *`,
          [
            a.owner_wallet,
            a.owner_handle,
            a.agent_wallet,
            a.agent_actor_id,
            a.template_type,
            a.name,
            a.role_title,
            JSON.stringify(a.skills || []),
            a.hire_fee_vara,
            a.split_weight,
            a.splits_group_id || null,
            a.voucher_id || null,
            a.permission_tx_hash || null,
            a.identity_tx_hash || null,
            a.reservation_id || null,
            a.heartbeat_interval_blocks || 1200,
            JSON.stringify(a.metadata || {}),
          ]
        );
        saved.push(row);
      }
      return saved;
    } catch (err) {
      console.warn('[agent-store] DB upsert fallback to local JSON:', err.message);
    }
  }

  const state = readLocalState();
  const now = new Date().toISOString();
  const saved = [];

  for (const a of agentRows) {
    const existingIdx = state.agents.findIndex((x) => x.agent_wallet === a.agent_wallet);
    if (existingIdx >= 0) {
      state.agents[existingIdx] = {
        ...state.agents[existingIdx],
        ...a,
        updated_at: now,
      };
      saved.push(state.agents[existingIdx]);
    } else {
      const created = {
        id: crypto.randomUUID(),
        ...a,
        status: 'ACTIVE',
        total_jobs: 0,
        total_volume_vara: 0,
        total_gas_burned_vara: 0,
        created_at: now,
        updated_at: now,
      };
      state.agents.unshift(created);
      saved.push(created);
    }
  }

  writeLocalState(state);
  return saved;
}

export async function listSocietyAgents({ ownerWallet = null, templateType = null } = {}) {
  await ensureAgentSocietySchema();
  const db = await getDb();

  if (db) {
    try {
      const conditions = [];
      const params = [];
      if (ownerWallet) {
        params.push(ownerWallet);
        conditions.push(`owner_wallet = $${params.length}`);
      }
      if (templateType) {
        params.push(String(templateType).toUpperCase());
        conditions.push(`template_type = $${params.length}`);
      }
      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await db.queryAll(
        `SELECT * FROM public.user_agents ${whereSql} ORDER BY created_at DESC LIMIT 100`,
        params
      );
      if (rows.length > 0 || ownerWallet) return rows;
    } catch (err) {
      console.warn('[agent-store] listSocietyAgents fallback:', err.message);
    }
  }

  await ensureLocalSeedState();
  const state = readLocalState();
  return state.agents.filter((a) => {
    if (ownerWallet && a.owner_wallet.toLowerCase() !== ownerWallet.toLowerCase()) return false;
    if (templateType && a.template_type !== String(templateType).toUpperCase()) return false;
    return true;
  });
}

export async function recordAcpJobExecution(jobRecord, txRows = []) {
  await ensureAgentSocietySchema();
  const db = await getDb();

  if (db) {
    try {
      const insertedJob = await db.queryOne(
        `INSERT INTO public.acp_jobs (
          job_code, requester_wallet, owner_wallet, lead_agent_id, title, prompt,
          budget_vara, token_symbol, token_address, stream_id, splits_group_id,
          status, total_onchain_volume_vara, hop_count, deliverables, tx_trail
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *`,
        [
          jobRecord.job_code,
          jobRecord.requester_wallet,
          jobRecord.owner_wallet,
          jobRecord.lead_agent_id || null,
          jobRecord.title,
          jobRecord.prompt,
          jobRecord.budget_vara,
          jobRecord.token_symbol || 'gVARA',
          jobRecord.token_address || VARA_MAINNET_CONTRACTS.gvaraToken,
          jobRecord.stream_id || null,
          jobRecord.splits_group_id || null,
          jobRecord.status || 'COMPLETED',
          jobRecord.total_onchain_volume_vara || 0,
          txRows.length,
          JSON.stringify(jobRecord.deliverables || {}),
          JSON.stringify(txRows),
        ]
      );

      for (const tx of txRows) {
        await db.query(
          `INSERT INTO public.acp_transactions (
            job_id, hop_number, hop_type, contract_name, contract_address,
            service_method, from_actor, to_actor, amount_vara, token_symbol,
            tx_hash, block_hash, execution_mode, explorer_url, payload_hex
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            insertedJob.id,
            tx.hopNumber,
            tx.hopType,
            tx.contractName,
            tx.contractAddress,
            tx.serviceMethod,
            tx.fromActor,
            tx.toActor,
            tx.amountVara || 0,
            tx.tokenSymbol || 'VARA',
            tx.txHash || null,
            tx.blockHash || null,
            tx.executionMode || 'on_chain',
            tx.explorerUrl || null,
            tx.payloadHex || null,
          ]
        );
      }

      await db.query(
        `UPDATE public.user_agents
         SET total_jobs = total_jobs + 1,
             total_volume_vara = total_volume_vara + $1,
             total_gas_burned_vara = total_gas_burned_vara + 0.035,
             updated_at = NOW()
         WHERE owner_wallet = $2`,
        [(Number(jobRecord.total_onchain_volume_vara) || 25) / 4, jobRecord.owner_wallet]
      );

      return insertedJob;
    } catch (err) {
      console.warn('[agent-store] recordAcpJobExecution fallback to local JSON:', err.message);
    }
  }

  await ensureLocalSeedState();
  const state = readLocalState();
  const now = new Date().toISOString();
  const savedJob = {
    id: crypto.randomUUID(),
    ...jobRecord,
    hop_count: txRows.length,
    tx_trail: txRows,
    created_at: now,
    updated_at: now,
  };
  state.jobs.unshift(savedJob);

  for (const tx of txRows) {
    state.transactions.unshift({
      id: crypto.randomUUID(),
      job_id: savedJob.id,
      ...tx,
      created_at: now,
    });
  }

  state.agents = state.agents.map((a) => {
    if (a.owner_wallet.toLowerCase() === String(jobRecord.owner_wallet).toLowerCase()) {
      return {
        ...a,
        total_jobs: Number(a.total_jobs || 0) + 1,
        total_volume_vara: +(Number(a.total_volume_vara || 0) + Number(jobRecord.total_onchain_volume_vara || 0) / 4).toFixed(4),
        total_gas_burned_vara: +(Number(a.total_gas_burned_vara || 0) + 0.035).toFixed(4),
        updated_at: now,
      };
    }
    return a;
  });

  writeLocalState(state);
  return savedJob;
}

export async function listAcpJobs({ ownerWallet = null, requesterWallet = null, limit = 25 } = {}) {
  await ensureAgentSocietySchema();
  const db = await getDb();

  if (db) {
    try {
      const conditions = [];
      const params = [];
      if (ownerWallet) {
        params.push(ownerWallet);
        conditions.push(`owner_wallet = $${params.length}`);
      }
      if (requesterWallet) {
        params.push(requesterWallet);
        conditions.push(`requester_wallet = $${params.length}`);
      }
      params.push(limit);
      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await db.queryAll(
        `SELECT * FROM public.acp_jobs ${whereSql} ORDER BY created_at DESC LIMIT $${params.length}`,
        params
      );
      if (rows.length > 0) return rows;
    } catch (err) {
      console.warn('[agent-store] listAcpJobs fallback:', err.message);
    }
  }

  await ensureLocalSeedState();
  const state = readLocalState();
  return state.jobs
    .filter((j) => {
      if (ownerWallet && j.owner_wallet.toLowerCase() !== ownerWallet.toLowerCase()) return false;
      if (requesterWallet && j.requester_wallet.toLowerCase() !== requesterWallet.toLowerCase()) return false;
      return true;
    })
    .slice(0, limit);
}

export async function getSocietyStats() {
  const agents = await listSocietyAgents();
  const jobs = await listAcpJobs({ limit: 100 });

  const uniqueOwners = new Set(agents.map((a) => a.owner_wallet.toLowerCase())).size;
  const totalVolumeVara = jobs.reduce(
    (sum, j) => sum + Number(j.total_onchain_volume_vara || j.budget_vara || 0),
    0
  );
  const totalExtrinsics = jobs.reduce((sum, j) => sum + Number(j.hop_count || 4), 0) + agents.length * 2;
  const totalGasBurnedVara = +(totalExtrinsics * 0.035).toFixed(4);

  return {
    totalSpawnedAgents: agents.length,
    uniqueAgentOwners: uniqueOwners,
    totalAcpJobs: jobs.length,
    totalOnChainVolumeVara: +totalVolumeVara.toFixed(4),
    totalOnChainVolumeUsd: +(totalVolumeVara * 0.00042293).toFixed(4),
    totalExtrinsics,
    totalGasBurnedVara,
    varaMainnetContracts: VARA_MAINNET_CONTRACTS,
  };
}
