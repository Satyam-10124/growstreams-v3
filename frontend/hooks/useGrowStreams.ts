'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import {
  MAINNET_CONTRACTS,
  ZERO_ACTOR_ID,
  useVaraWallet,
  decodeVaraAddressToHex,
  signSailsExtrinsicOnMainnet,
  recordUserPosition,
  encodeVaultDepositNativePayload,
  encodeVaultWithdrawNativePayload,
  encodeVaultDepositTokensPayload,
  encodeVaultWithdrawTokensPayload,
  encodeSuperTokenWrapNativePayload,
  encodeSuperTokenUnwrapNativePayload,
  encodeSuperTokenWrapPayload,
  encodeSuperTokenUnwrapPayload,
  encodeWvaraWrapPayload,
  encodeWvaraUnwrapPayload,
  encodeCreateStreamPayload,
  encodeStreamIdActionPayload,
  encodeStreamDepositPayload,
  encodeStreamUpdatePayload,
  encodeCreateSplitGroupPayload,
  encodeDistributeSplitPayload,
  encodeGrantPermissionPayload,
  encodeRevokePermissionPayload,
  encodeBindIdentityPayload,
  encodeGrowTokenActionPayload,
  encodeGrowTokenBurnPayload,
  encodeCreateBountyPayload,
  encodeBountyIdActionPayload,
} from '@/lib/vara-wallet';
import { toast } from 'sonner';
import { useActiveAccount } from './useActiveAccount';

export { useActiveAccount };

export const PROGRAM_IDS: Record<string, `0x${string}`> = {
  streamCore: (process.env.NEXT_PUBLIC_STREAM_CORE_ID as `0x${string}`) || MAINNET_CONTRACTS.streamCoreV2,
  streamCoreV3: (process.env.NEXT_PUBLIC_STREAM_CORE_V3_ID as `0x${string}`) || MAINNET_CONTRACTS.streamCoreV3,
  tokenVault: (process.env.NEXT_PUBLIC_TOKEN_VAULT_ID as `0x${string}`) || MAINNET_CONTRACTS.tokenVault,
  growToken: (process.env.NEXT_PUBLIC_GROW_TOKEN_ID as `0x${string}`) || MAINNET_CONTRACTS.growToken,
  gvaraToken: (process.env.NEXT_PUBLIC_GVARA_TOKEN_ID as `0x${string}`) || MAINNET_CONTRACTS.gvaraV2,
  gvaraV3Token: (process.env.NEXT_PUBLIC_GVARA_V3_TOKEN_ID as `0x${string}`) || MAINNET_CONTRACTS.gvaraV3,
  wvaraToken: (process.env.NEXT_PUBLIC_WVARA_TOKEN_ID as `0x${string}`) || MAINNET_CONTRACTS.wvara,
  superTokenGrow: MAINNET_CONTRACTS.superTokenGrow,
  splitsRouter: (process.env.NEXT_PUBLIC_SPLITS_ROUTER_ID as `0x${string}`) || MAINNET_CONTRACTS.splitsRouter,
  permissionManager: (process.env.NEXT_PUBLIC_PERMISSION_MANAGER_ID as `0x${string}`) || MAINNET_CONTRACTS.permissionManager,
  bountyAdapter: (process.env.NEXT_PUBLIC_BOUNTY_ADAPTER_ID as `0x${string}`) || MAINNET_CONTRACTS.bountyAdapter,
  identityRegistry: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ID as `0x${string}`) || MAINNET_CONTRACTS.identityRegistry,
  stonkOrderbook: (process.env.NEXT_PUBLIC_STONK_ORDERBOOK_ID as `0x${string}`) || MAINNET_CONTRACTS.stonkOrderbook,
  stonkPerpsDesk: (process.env.NEXT_PUBLIC_STONK_PERPS_DESK_ID as `0x${string}`) || MAINNET_CONTRACTS.stonkPerpsDesk,
};

export interface SendResult {
  blockHash: string;
  signerAddress: string;
  signerActorHex: `0x${string}`;
  subscanUrl: string;
  success: boolean;
}

export function useUnifiedVaraAccount() {
  const { wallet } = useVaraWallet();
  const { account: gearAccount } = useAccount();

  return useMemo(() => {
    if (wallet) {
      return {
        address: wallet.address,
        decodedAddress: wallet.decodedAddress,
        name: wallet.name,
        varaBalance: wallet.varaBalance,
      };
    }
    if (gearAccount) {
      return {
        address: gearAccount.address,
        decodedAddress: gearAccount.decodedAddress as `0x${string}`,
        name: gearAccount.meta?.name || 'Vara Wallet',
        varaBalance: 0,
      };
    }
    return null;
  }, [wallet, gearAccount]);
}

export function useGearSign() {
  const unifiedAccount = useUnifiedVaraAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signAndSend = useCallback(
    async (
      contract: keyof typeof PROGRAM_IDS | `0x${string}`,
      payloadHex: `0x${string}`,
      valuePlancks: bigint | number | string = 0,
      receiptLabel?: { type?: 'STREAM' | 'SPOT' | 'PERP' | 'SQUAD'; market?: string; side?: string; sizeVara?: number }
    ): Promise<SendResult> => {
      setLoading(true);
      setError(null);

      try {
        const programId = (
          String(contract).startsWith('0x')
            ? contract
            : PROGRAM_IDS[contract as keyof typeof PROGRAM_IDS]
        ) as `0x${string}`;

        const res = await signSailsExtrinsicOnMainnet({
          programId,
          payloadHex,
          valuePlancks,
          preferredAddress: unifiedAccount?.address,
        });

        const numericVal = Number(BigInt(valuePlancks || 0)) / 1e12;
        recordUserPosition({
          id: `tx-${Date.now()}`,
          type:
            receiptLabel?.type ||
            (contract === 'streamCore' || contract === 'streamCoreV3' ? 'STREAM' : 'SPOT'),
          market: receiptLabel?.market || String(contract).toUpperCase(),
          side:
            receiptLabel?.side ||
            (numericVal > 0 ? `VALUE ${numericVal.toFixed(2)} VARA` : 'ON-CHAIN EXTRINSIC'),
          sizeVara: receiptLabel?.sizeVara ?? (numericVal > 0 ? numericVal : 10),
          leverage: 1,
          entryPrice: 1,
          markPrice: 1,
          pnlVara: 0,
          pnlPct: 0,
          timestamp: `Confirmed Block ${res.blockHash.slice(0, 10)}…`,
          blockHash: res.blockHash,
          subscanUrl: res.subscanUrl,
          status: 'ACTIVE',
        });

        return {
          blockHash: res.blockHash,
          signerAddress: res.signerAddress,
          signerActorHex: res.signerActorHex,
          subscanUrl: res.subscanUrl,
          success: true,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [unifiedAccount]
  );

  return { signAndSend, loading, error, account: unifiedAccount };
}

export function useStreamActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const resolveStreamContract = (tokenHex: string): 'streamCoreV3' | 'streamCore' => {
    const t = tokenHex.toLowerCase();
    if (
      t === MAINNET_CONTRACTS.gvaraV3.toLowerCase() ||
      t === MAINNET_CONTRACTS.wvara.toLowerCase()
    ) {
      return 'streamCoreV3';
    }
    return 'streamCore';
  };

  const createStream = async (
    receiver: string,
    token: string,
    flowRate: string,
    initialDeposit: string
  ) => {
    const receiverHex = await decodeVaraAddressToHex(receiver);
    const tokenHex =
      token === '0x0' || token === ZERO_ACTOR_ID
        ? ZERO_ACTOR_ID
        : await decodeVaraAddressToHex(token);
    const targetContract = resolveStreamContract(tokenHex);
    const payload = encodeCreateStreamPayload(receiverHex, tokenHex, flowRate, initialDeposit);

    // StreamCore pulls from gVARA (V3) or TokenVault (V2) — msg.value on CreateStream is 0
    return signAndSend(targetContract, payload, 0, {
      type: 'STREAM',
      market: targetContract === 'streamCoreV3' ? 'StreamCore V3 (gVARA)' : 'StreamCore V2 (Vault)',
      side: `STREAM ${(Number(initialDeposit) / 1e12).toFixed(2)}`,
      sizeVara: Number(initialDeposit) / 1e12,
    });
  };

  // 1-Click Auto-Wrap Native VARA -> gVARA V3 (+3% fee safety buffer) & Open Stream on StreamCore V3
  const wrapAndCreateGvaraStream = async (
    receiver: string,
    flowRatePlancks: string,
    initialDepositPlancks: string
  ) => {
    const wrapAmountPlancks = (BigInt(initialDepositPlancks) * BigInt(103)) / BigInt(100);
    await signAndSend(
      'gvaraV3Token',
      encodeSuperTokenWrapNativePayload(),
      wrapAmountPlancks,
      {
        type: 'SPOT',
        market: 'gVARA SuperToken (Wrap)',
        side: 'WRAP VARA → gVARA',
        sizeVara: Number(wrapAmountPlancks) / 1e12,
      }
    );
    const receiverHex = await decodeVaraAddressToHex(receiver);
    const payload = encodeCreateStreamPayload(
      receiverHex,
      MAINNET_CONTRACTS.gvaraV3,
      flowRatePlancks,
      initialDepositPlancks
    );
    return signAndSend('streamCoreV3', payload, 0, {
      type: 'STREAM',
      market: 'StreamCore V3 (gVARA)',
      side: `STREAM ${(Number(initialDepositPlancks) / 1e12).toFixed(2)} gVARA`,
      sizeVara: Number(initialDepositPlancks) / 1e12,
    });
  };

  const setupVault = async () => {
    try {
      const payload =
        '0x3453747265616d5365727669636534536574546f6b656e5661756c74657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9' as const;
      await signAndSend('streamCore', payload);
      toast.success('Token vault linked successfully!');
    } catch (err: unknown) {
      toast.error('Failed to link vault: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const pauseStream = async (id: number, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamIdActionPayload('PauseStream', id));
  };

  const resumeStream = async (id: number, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamIdActionPayload('ResumeStream', id));
  };

  const depositToStream = async (id: number, amount: string, token = '') => {
    const target = resolveStreamContract(token || ZERO_ACTOR_ID);
    return signAndSend(target, encodeStreamDepositPayload(id, amount), 0);
  };

  const withdrawFromStream = async (id: number, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamIdActionPayload('Withdraw', id));
  };

  const stopStream = async (id: number, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamIdActionPayload('StopStream', id));
  };

  const updateStream = async (id: number, flowRate: string, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamUpdatePayload(id, flowRate));
  };

  const liquidateStream = async (id: number, isV3 = false) => {
    return signAndSend(isV3 ? 'streamCoreV3' : 'streamCore', encodeStreamIdActionPayload('Liquidate', id));
  };

  return {
    createStream,
    wrapAndCreateGvaraStream,
    pauseStream,
    resumeStream,
    depositToStream,
    setupVault,
    withdrawFromStream,
    stopStream,
    updateStream,
    liquidateStream,
    loading,
    error,
    account,
  };
}

export function useVaultActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const depositTokens = async (token: string, amount: string) => {
    const tokenHex = await decodeVaraAddressToHex(token);
    return signAndSend('tokenVault', encodeVaultDepositTokensPayload(tokenHex, amount), 0, {
      type: 'SPOT',
      market: 'TokenVault (GROW)',
      side: `DEPOSIT ${(Number(amount) / 1e12).toFixed(2)} GROW`,
      sizeVara: Number(amount) / 1e12,
    });
  };

  const withdrawTokens = async (token: string, amount: string) => {
    const tokenHex = await decodeVaraAddressToHex(token);
    return signAndSend('tokenVault', encodeVaultWithdrawTokensPayload(tokenHex, amount), 0, {
      type: 'SPOT',
      market: 'TokenVault (GROW)',
      side: `WITHDRAW ${(Number(amount) / 1e12).toFixed(2)} GROW`,
      sizeVara: Number(amount) / 1e12,
    });
  };

  const depositNative = async (amountPlancks: string) => {
    return signAndSend('tokenVault', encodeVaultDepositNativePayload(), BigInt(amountPlancks), {
      type: 'SPOT',
      market: 'TokenVault (Native VARA)',
      side: `DEPOSIT ${(Number(amountPlancks) / 1e12).toFixed(2)} VARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  const withdrawNative = async (amountPlancks: string) => {
    return signAndSend('tokenVault', encodeVaultWithdrawNativePayload(amountPlancks), 0, {
      type: 'SPOT',
      market: 'TokenVault (Native VARA)',
      side: `WITHDRAW ${(Number(amountPlancks) / 1e12).toFixed(2)} VARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  return { depositTokens, withdrawTokens, depositNative, withdrawNative, loading, error, account };
}

export function useWrapperActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  // Wrap Native VARA -> gVARA V3 SuperToken (1:1 streamable wrapper)
  const wrapGvaraNative = async (amountPlancks: string) => {
    return signAndSend('gvaraV3Token', encodeSuperTokenWrapNativePayload(), BigInt(amountPlancks), {
      type: 'SPOT',
      market: 'gVARA SuperToken',
      side: `WRAP ${(Number(amountPlancks) / 1e12).toFixed(2)} VARA → gVARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  // Unwrap gVARA V3 SuperToken -> Native VARA (1:1 instant redemption)
  const unwrapGvaraNative = async (amountPlancks: string) => {
    return signAndSend('gvaraV3Token', encodeSuperTokenUnwrapNativePayload(amountPlancks), 0, {
      type: 'SPOT',
      market: 'gVARA SuperToken',
      side: `UNWRAP ${(Number(amountPlancks) / 1e12).toFixed(2)} gVARA → VARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  // Wrap Native VARA -> wVARA VFT (1:1 VFT wrapper)
  const wrapWvara = async (amountPlancks: string) => {
    return signAndSend('wvaraToken', encodeWvaraWrapPayload(), BigInt(amountPlancks), {
      type: 'SPOT',
      market: 'wVARA Wrapper',
      side: `WRAP ${(Number(amountPlancks) / 1e12).toFixed(2)} VARA → wVARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  // Unwrap wVARA VFT -> Native VARA (1:1 redemption)
  const unwrapWvara = async (amountPlancks: string) => {
    return signAndSend('wvaraToken', encodeWvaraUnwrapPayload(amountPlancks), 0, {
      type: 'SPOT',
      market: 'wVARA Wrapper',
      side: `UNWRAP ${(Number(amountPlancks) / 1e12).toFixed(2)} wVARA → VARA`,
      sizeVara: Number(amountPlancks) / 1e12,
    });
  };

  // Approve GROW + Wrap GROW -> gGROW SuperToken
  const wrapGrowSuperToken = async (amountUnits: string) => {
    await signAndSend(
      'growToken',
      encodeGrowTokenActionPayload('Approve', MAINNET_CONTRACTS.superTokenGrow, amountUnits),
      0
    );
    return signAndSend('superTokenGrow', encodeSuperTokenWrapPayload(amountUnits), 0, {
      type: 'SPOT',
      market: 'gGROW SuperToken',
      side: `WRAP ${(Number(amountUnits) / 1e12).toFixed(2)} GROW → gGROW`,
      sizeVara: Number(amountUnits) / 1e12,
    });
  };

  // Unwrap gGROW SuperToken -> GROW
  const unwrapGrowSuperToken = async (amountUnits: string) => {
    return signAndSend('superTokenGrow', encodeSuperTokenUnwrapPayload(amountUnits), 0, {
      type: 'SPOT',
      market: 'gGROW SuperToken',
      side: `UNWRAP ${(Number(amountUnits) / 1e12).toFixed(2)} gGROW → GROW`,
      sizeVara: Number(amountUnits) / 1e12,
    });
  };

  return {
    wrapGvaraNative,
    unwrapGvaraNative,
    wrapWvara,
    unwrapWvara,
    wrapGrowSuperToken,
    unwrapGrowSuperToken,
    loading,
    error,
    account,
  };
}

export function useSplitsActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const createGroup = async (recipients: { address: string; weight: number }[]) => {
    const mapped = await Promise.all(
      recipients.map(async (r) => ({
        addressHex: await decodeVaraAddressToHex(r.address),
        weight: r.weight,
      }))
    );
    return signAndSend('splitsRouter', encodeCreateSplitGroupPayload(mapped), 0, {
      type: 'SQUAD',
      market: 'SplitsRouter',
      side: `CREATE ${recipients.length}-WAY SPLIT`,
      sizeVara: 10,
    });
  };

  const distribute = async (id: number, token: string, amount: string) => {
    const isNative = token === ZERO_ACTOR_ID || token === '0x0';
    const tokenHex = isNative ? ZERO_ACTOR_ID : await decodeVaraAddressToHex(token);
    return signAndSend(
      'splitsRouter',
      encodeDistributeSplitPayload(id, tokenHex, amount),
      isNative ? BigInt(amount) : 0,
      {
        type: 'SQUAD',
        market: `SplitsRouter Group #${id}`,
        side: `DISTRIBUTE ${(Number(amount) / 1e12).toFixed(2)} ${isNative ? 'VARA' : 'GROW'}`,
        sizeVara: Number(amount) / 1e12,
      }
    );
  };

  return { createGroup, distribute, loading, error, account };
}

export function useBountyActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const createBounty = async (
    title: string,
    token: string,
    maxFlowRate: string,
    minScore: number,
    totalBudget: string
  ) => {
    const tokenHex =
      token === ZERO_ACTOR_ID || token === '0x0'
        ? ZERO_ACTOR_ID
        : await decodeVaraAddressToHex(token);
    return signAndSend(
      'bountyAdapter',
      encodeCreateBountyPayload(title, tokenHex, maxFlowRate, minScore, totalBudget),
      0,
      {
        type: 'SPOT',
        market: 'BountyAdapter',
        side: `CREATE BOUNTY: ${title.slice(0, 18)}`,
        sizeVara: Number(totalBudget) / 1e12,
      }
    );
  };

  const claimBounty = async (id: number) => {
    return signAndSend('bountyAdapter', encodeBountyIdActionPayload('ClaimBounty', id), 0, {
      type: 'SPOT',
      market: `BountyAdapter #${id}`,
      side: 'CLAIM BOUNTY',
      sizeVara: 25,
    });
  };

  const completeBounty = async (id: number) => {
    return signAndSend('bountyAdapter', encodeBountyIdActionPayload('CompleteBounty', id), 0);
  };

  return { createBounty, claimBounty, completeBounty, loading, error, account };
}

export function usePermissionActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const grantPermission = async (grantee: string, scope: string) => {
    const granteeHex = await decodeVaraAddressToHex(grantee);
    return signAndSend('permissionManager', encodeGrantPermissionPayload(granteeHex, scope, null), 0, {
      type: 'SPOT',
      market: 'PermissionManager',
      side: `GRANT ${scope}`,
      sizeVara: 5,
    });
  };

  const revokePermission = async (grantee: string, scope: string) => {
    const granteeHex = await decodeVaraAddressToHex(grantee);
    return signAndSend('permissionManager', encodeRevokePermissionPayload(granteeHex, scope), 0, {
      type: 'SPOT',
      market: 'PermissionManager',
      side: `REVOKE ${scope}`,
      sizeVara: 5,
    });
  };

  return { grantPermission, revokePermission, loading, error, account };
}

export function useGrowTokenActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const approve = async (spender: string, amount: string) => {
    const spenderHex = await decodeVaraAddressToHex(spender);
    return signAndSend('growToken', encodeGrowTokenActionPayload('Approve', spenderHex, amount));
  };

  const transfer = async (to: string, amount: string) => {
    const toHex = await decodeVaraAddressToHex(to);
    return signAndSend('growToken', encodeGrowTokenActionPayload('Transfer', toHex, amount));
  };

  const mint = async (to: string, amount: string) => {
    const toHex = await decodeVaraAddressToHex(to);
    return signAndSend('growToken', encodeGrowTokenActionPayload('Mint', toHex, amount));
  };

  const burn = async (amount: string) => {
    return signAndSend('growToken', encodeGrowTokenBurnPayload(amount));
  };

  return { approve, transfer, mint, burn, loading, error, account };
}

export function useIdentityActions() {
  const { signAndSend, loading, error, account } = useGearSign();

  const bindIdentity = async (actorId: string, githubUsername: string, proofHash: string, score: number) => {
    const actorHex = await decodeVaraAddressToHex(actorId);
    return signAndSend(
      'identityRegistry',
      encodeBindIdentityPayload(actorHex, githubUsername, proofHash, score),
      0,
      {
        type: 'SPOT',
        market: 'IdentityRegistry',
        side: `BIND @${githubUsername}`,
        sizeVara: 5,
      }
    );
  };

  return { bindIdentity, loading, error, account };
}
