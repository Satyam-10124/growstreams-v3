import crypto from 'crypto';
import {
  deriveHumanUserWallet,
  deriveAgentWallet,
  deriveMultiAgentSuite,
} from './wallet-factory.mjs';
import { TREASURY_CONFIG } from './treasury-budget-guard.mjs';

export const PROTOCOL_AGENT_BONUS_VARA = 100; // 100 VARA protocol bonus per spawned agent
const ONE_VARA = 1_000_000_000_000n; // 10^12 plancks

const topUpLedger = [];
const protocolBonusClaims = new Map(); // agentWallet -> claimRecord

async function getSailsClient() {
  try {
    return await import('../../api/src/sails-client.mjs');
  } catch {
    return null;
  }
}

function sendExtrinsicAndWait(tx, signer) {
  return new Promise((resolve, reject) => {
    let settled = false;
    tx.signAndSend(signer, ({ status, txHash, dispatchError }) => {
      if (settled) return;
      if (dispatchError) {
        settled = true;
        reject(new Error(`Extrinsic dispatch error: ${dispatchError.toString()}`));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        settled = true;
        resolve({
          blockHash: status.isInBlock
            ? status.asInBlock.toHex()
            : status.asFinalized.toHex(),
          txHash: txHash.toHex(),
        });
      }
    }).catch((err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

export async function claimMailboxForAccount(api, signer) {
  const messageIds = [];
  try {
    if (api.mailbox && typeof api.mailbox.read === 'function') {
      const items = await api.mailbox.read(signer.address);
      for (const item of items || []) {
        const msg = Array.isArray(item) ? item[0] : item;
        const id = msg?.id?.toHex ? msg.id.toHex() : msg?.id || null;
        if (id) messageIds.push(String(id));
      }
    }
  } catch {}
  if (messageIds.length === 0 && api.query?.gearMessenger?.mailbox) {
    try {
      const entries = await api.query.gearMessenger.mailbox.entries(signer.address);
      for (const [key] of entries) {
        const msgId = key.args[1]?.toHex ? key.args[1].toHex() : String(key.args[1]);
        if (msgId) messageIds.push(msgId);
      }
    } catch {}
  }
  const uniqueIds = [...new Set(messageIds)];
  if (uniqueIds.length === 0) return null;
  const claimTxs = uniqueIds.map((id) => api.tx.gear.claimValue(id));
  const tx = claimTxs.length === 1 ? claimTxs[0] : api.tx.utility.batchAll(claimTxs);
  return await sendExtrinsicAndWait(tx, signer);
}

/**
 * Funds an Agent Wallet with Creator Top-Up + 100 VARA Protocol Bonus.
 */
export async function topUpAgentWallet({
  ownerWallet,
  ownerHandle = 'VaraTrader',
  agentWallet,
  templateType = 'TRADER',
  creatorTopUpVara = 25,
  includeProtocolBonus = true,
  executeOnChain = false,
}) {
  const cleanCreatorTopUp = Math.max(0, Number(creatorTopUpVara) || 0);
  const alreadyClaimed = protocolBonusClaims.has(agentWallet);
  const bonusVara =
    includeProtocolBonus && !alreadyClaimed ? PROTOCOL_AGENT_BONUS_VARA : 0;
  const totalFundedVara = Number((cleanCreatorTopUp + bonusVara).toFixed(4));

  let txHash = null;
  let blockHash = null;
  let onChainExecuted = false;

  if (executeOnChain && totalFundedVara > 0) {
    const sailsClient = await getSailsClient();
    const api = sailsClient?.getApi ? sailsClient.getApi() : null;
    const treasurySigner = sailsClient?.getKeyring ? sailsClient.getKeyring() : null;
    if (api && treasurySigner) {
      const amountPlancks = BigInt(Math.round(totalFundedVara * 1e4)) * (ONE_VARA / 10000n);
      const tx = api.tx.balances.transferKeepAlive(agentWallet, amountPlancks);
      const sent = await sendExtrinsicAndWait(tx, treasurySigner);
      txHash = sent.txHash;
      blockHash = sent.blockHash;
      onChainExecuted = true;
    }
  }

  const record = {
    topUpId: `TOPUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    ownerWallet,
    ownerHandle,
    agentWallet,
    templateType: String(templateType).toUpperCase(),
    creatorTopUpVara: cleanCreatorTopUp,
    protocolBonusVara: bonusVara,
    totalFundedVara,
    onChainExecuted,
    txHash: txHash || `0xtopup_${crypto.randomBytes(28).toString('hex')}`,
    blockHash,
    explorerUrl: blockHash ? `https://vara.subscan.io/block/${blockHash}` : null,
    createdAt: new Date().toISOString(),
  };

  if (bonusVara > 0) {
    protocolBonusClaims.set(agentWallet, {
      agentWallet,
      ownerHandle,
      templateType,
      bonusVara,
      claimedAt: record.createdAt,
      txHash: record.txHash,
    });
  }

  topUpLedger.unshift(record);
  return record;
}

/**
 * Batch-funds a squad of 4-6 agents with the 100 VARA Protocol Bonus + Creator Top-Up on Vara Mainnet.
 */
export async function batchFundSquadWithProtocolBonus({
  ownerWallet,
  ownerHandle,
  agentCount = 5,
  creatorTopUpPerAgentVara = 20,
  protocolBonusPerAgentVara = PROTOCOL_AGENT_BONUS_VARA,
  userWalletTopUpVara = 150,
  executeOnChain = false,
}) {
  const suite = await deriveMultiAgentSuite(ownerWallet, ownerHandle, agentCount);
  const transfers = [];
  const records = [];

  const sailsClient = executeOnChain ? await getSailsClient() : null;
  const api = sailsClient?.getApi ? sailsClient.getApi() : null;
  const treasurySigner = sailsClient?.getKeyring ? sailsClient.getKeyring() : null;

  if (executeOnChain && api && treasurySigner && userWalletTopUpVara > 0) {
    const userPlancks = BigInt(Math.round(userWalletTopUpVara * 1e4)) * (ONE_VARA / 10000n);
    transfers.push(api.tx.balances.transferKeepAlive(ownerWallet, userPlancks));
  }

  for (const agent of suite) {
    const bonus = Number(protocolBonusPerAgentVara ?? PROTOCOL_AGENT_BONUS_VARA);
    const topUp = Number(creatorTopUpPerAgentVara ?? 0);
    const totalAgentVara = bonus + topUp;

    if (executeOnChain && api && treasurySigner && totalAgentVara > 0) {
      const plancks = BigInt(Math.round(totalAgentVara * 1e4)) * (ONE_VARA / 10000n);
      transfers.push(api.tx.balances.transferKeepAlive(agent.agent_wallet, plancks));
    }

    const rec = {
      topUpId: `TOPUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      ownerWallet,
      ownerHandle,
      agentWallet: agent.agent_wallet,
      agentName: agent.name,
      templateType: agent.template_type,
      creatorTopUpVara: topUp,
      protocolBonusVara: bonus,
      totalFundedVara: totalAgentVara,
      onChainExecuted: Boolean(executeOnChain && api && treasurySigner),
      createdAt: new Date().toISOString(),
    };
    protocolBonusClaims.set(agent.agent_wallet, {
      agentWallet: agent.agent_wallet,
      ownerHandle,
      templateType: agent.template_type,
      bonusVara: bonus,
      claimedAt: rec.createdAt,
    });
    records.push(rec);
    topUpLedger.unshift(rec);
  }

  let batchTxHash = null;
  let batchBlockHash = null;
  if (executeOnChain && api && treasurySigner && transfers.length > 0) {
    const batchTx = api.tx.utility.batchAll(transfers);
    const res = await sendExtrinsicAndWait(batchTx, treasurySigner);
    batchTxHash = res.txHash;
    batchBlockHash = res.blockHash;
    for (const r of records) {
      r.txHash = batchTxHash;
      r.blockHash = batchBlockHash;
      r.explorerUrl = `https://vara.subscan.io/block/${batchBlockHash}`;
    }
  }

  return {
    ownerWallet,
    ownerHandle,
    agentCount: suite.length,
    userWalletTopUpVara,
    protocolBonusPerAgentVara,
    creatorTopUpPerAgentVara,
    totalSquadFundedVara:
      userWalletTopUpVara +
      suite.length * (Number(protocolBonusPerAgentVara) + Number(creatorTopUpPerAgentVara)),
    batchTxHash,
    batchBlockHash,
    explorerUrl: batchBlockHash ? `https://vara.subscan.io/block/${batchBlockHash}` : null,
    agentsFunded: records,
  };
}

export function getTopUpStats() {
  const totalProtocolBonusVara = topUpLedger.reduce(
    (acc, r) => acc + Number(r.protocolBonusVara || 0),
    0
  );
  const totalCreatorTopUpVara = topUpLedger.reduce(
    (acc, r) => acc + Number(r.creatorTopUpVara || 0),
    0
  );
  return {
    protocolBonusPerAgentVara: PROTOCOL_AGENT_BONUS_VARA,
    totalAgentsWithProtocolBonus: protocolBonusClaims.size,
    totalProtocolBonusDistributedVara: Number(totalProtocolBonusVara.toFixed(4)),
    totalCreatorTopUpVara: Number(totalCreatorTopUpVara.toFixed(4)),
    totalAgentCapitalFundedVara: Number((totalProtocolBonusVara + totalCreatorTopUpVara).toFixed(4)),
    recentTopUps: topUpLedger.slice(0, 40),
  };
}
