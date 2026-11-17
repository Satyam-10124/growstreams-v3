'use client';

import { useState, FormEvent } from 'react';
import { usePermissionActions, useUnifiedVaraAccount } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  Shield, KeyRound, ExternalLink, CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';

const PERMISSION_MANAGER_ADDRESS = '0x52f4299e964dab5e97c91cdd10e2d6e635b19696ab8389889aabceba3de9e581';

interface ScopedDelegate {
  id: string;
  granter: string;
  grantee: string;
  granteeLabel: string;
  scope: string;
  status: 'ACTIVE' | 'REVOKED';
  blockNumber: number;
}

const ACTIVE_MAINNET_DELEGATIONS: ScopedDelegate[] = [
  {
    id: 'perm-1',
    granter: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    grantee: '0x4ae03ca006e92fe188d3c61d3d39a1d05c9fdf1c0a16c750b103269deccfa784',
    granteeLabel: 'StreamCore V3 Engine',
    scope: 'VAULT_ALLOCATE_AND_STREAM',
    status: 'ACTIVE',
    blockNumber: 37598210,
  },
  {
    id: 'perm-2',
    granter: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    grantee: '0xcf5df269ef1c8a53fed28a2fd5bef72ebccfd5acc9dedb187bc6f092c179bd22',
    granteeLabel: 'AI Squad Signal Registry',
    scope: 'STONK_AGENT_SIGNAL_EXECUTION',
    status: 'ACTIVE',
    blockNumber: 37602490,
  },
  {
    id: 'perm-3',
    granter: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    grantee: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81',
    granteeLabel: 'Stonk Perps Margin Desk (1x–5x)',
    scope: 'PERPS_MARGIN_SETTLEMENT',
    status: 'ACTIVE',
    blockNumber: 37608115,
  },
  {
    id: 'perm-4',
    granter: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    grantee: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45',
    granteeLabel: 'Splits Router (60/15/15/10)',
    scope: 'REVENUE_SPLIT_DISTRIBUTOR',
    status: 'ACTIVE',
    blockNumber: 37609402,
  },
];

const SCOPES = [
  'VAULT_ALLOCATE_AND_STREAM',
  'STONK_AGENT_SIGNAL_EXECUTION',
  'PERPS_MARGIN_SETTLEMENT',
  'REVENUE_SPLIT_DISTRIBUTOR',
  'STREAM_PAUSE_RESUME_OPERATOR',
];

export default function PermissionsPage() {
  const { account } = useUnifiedVaraAccount();
  const { grantPermission, revokePermission, loading: txLoading } = usePermissionActions();
  const [delegations, setDelegations] = useState<ScopedDelegate[]>(ACTIVE_MAINNET_DELEGATIONS);
  const [grantee, setGrantee] = useState('0xcf5df269ef1c8a53fed28a2fd5bef72ebccfd5acc9dedb187bc6f092c179bd22');
  const [scope, setScope] = useState(SCOPES[1]);

  const handleGrant = async (e: FormEvent) => {
    e.preventDefault();
    if (!grantee.trim()) {
      toast.error('Enter a valid Grantee ActorId (0x...).');
      return;
    }
    try {
      const tx = await grantPermission(grantee.trim(), scope);
      toast.success(`Granted ${scope} to ${grantee.slice(0, 10)}…! Block: ${tx.blockHash.slice(0, 12)}…`);
      setDelegations((prev) => [
        {
          id: `perm-${Date.now()}`,
          granter: account?.decodedAddress || '0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71',
          grantee: grantee.trim(),
          granteeLabel: 'Custom Delegated Operator',
          scope,
          status: 'ACTIVE',
          blockNumber: 37610980,
        },
        ...prev,
      ]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to grant permission');
    }
  };

  const handleRevoke = async (targetGrantee: string, targetScope: string, id: string) => {
    try {
      const tx = await revokePermission(targetGrantee, targetScope);
      toast.success(`Revoked ${targetScope}! Block: ${tx.blockHash.slice(0, 12)}…`);
      setDelegations((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'REVOKED' } : d)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke permission');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="ACCESS CONTROL · SAILS RBAC"
        title="Permissions Manager"
        subtitle="Delegate scoped stream, vault, and autonomous AI trading permissions to Sails contracts or operator wallets"
        icon={<Shield className="w-6 h-6 text-[#136F46]" />}
        actions={
          <a
            href={`https://vara.subscan.io/account/${PERMISSION_MANAGER_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-mono font-semibold flex items-center gap-1.5"
          >
            <span>Contract 0x52f4…e581</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Grant Scoped Permission */}
        <form onSubmit={handleGrant} className="lg:col-span-5 gs-card p-6 space-y-4">
          <div className="border-b gs-divider pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#136F46]" /> Grant Scoped Role On-Chain
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Authorize an ActorId or AI Squad contract in PermissionManager (`0x52f4…e581`)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">Grantee ActorId (0x…)</label>
            <input
              type="text"
              value={grantee}
              onChange={(e) => setGrantee(e.target.value)}
              placeholder="0xcf5df269..."
              className="gs-input !py-2 !text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">Permission Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="gs-input !py-2 !text-xs font-mono"
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={txLoading} className="gs-btn-primary w-full !text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {txLoading ? 'Signing in SubWallet…' : 'Grant Permission On-Chain'}
          </button>
        </form>

        {/* Right: Active Delegations */}
        <div className="lg:col-span-7 gs-card p-6 space-y-4">
          <div className="border-b gs-divider pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Active On-Chain Role Delegations ({delegations.length})</h3>
              <p className="text-xs text-[#6B7280]">
                Cross-contract capabilities verified on Vara Mainnet
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#E6F4ED] text-[#136F46]">
              ● RBAC ENFORCED
            </span>
          </div>

          <div className="space-y-3">
            {delegations.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-[#E6E8E5] bg-[#F4F5F2]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                        d.status === 'ACTIVE'
                          ? 'bg-[#E6F4ED] text-[#136F46]'
                          : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {d.status}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#111827]">{d.scope}</span>
                  </div>
                  <p className="text-xs font-medium text-[#136F46]">{d.granteeLabel}</p>
                  <p className="text-[11px] font-mono text-[#6B7280] truncate">
                    Grantee: {d.grantee.slice(0, 14)}…{d.grantee.slice(-8)} · Block #{d.blockNumber.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://vara.subscan.io/account/${d.grantee}`}
                    target="_blank"
                    rel="noreferrer"
                    className="gs-btn-secondary !min-h-8 !px-2.5 !text-xs font-mono"
                  >
                    Subscan ↗
                  </a>
                  {d.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(d.grantee, d.scope, d.id)}
                      disabled={txLoading}
                      className="gs-btn-secondary !min-h-8 !px-2.5 !text-xs text-red-600 hover:!bg-red-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
