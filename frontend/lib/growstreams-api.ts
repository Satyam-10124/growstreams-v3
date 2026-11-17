function getApiBase(): string {
  let env = (process.env.NEXT_PUBLIC_GROWSTREAMS_API || '').trim().replace(/^["']|["']$/g, '');
  if (!env) return '';
  if (!env.startsWith('http://') && !env.startsWith('https://')) {
    env = `https://${env}`;
  }
  return env.replace(/\/+$/, '');
}

const API_BASE = getApiBase();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Always use local Next.js serverless routes for /api/protocol-overview and /api/agents
  // so live Vara Mainnet RPC counters & DeFiLlama Combined Suite metrics are never overwritten by stale Railway cache
  const preferLocalServerless =
    path.startsWith('/api/protocol-overview') || path.startsWith('/api/agents');
  const url = preferLocalServerless ? path : `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    // If external API returned 404 or 5xx and we have API_BASE, fall back to local /api/...
    if (!res.ok && API_BASE && path.startsWith('/api/')) {
      const fallbackRes = await fetch(path, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      }).catch(() => null);
      if (fallbackRes && fallbackRes.ok) {
        res = fallbackRes;
      }
    }
  } catch (err) {
    if (API_BASE && path.startsWith('/api/')) {
      const fallbackRes = await fetch(path, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      }).catch(() => null);
      if (fallbackRes) {
        res = fallbackRes;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // Handle 204 No Content or empty body safely
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // If response was HTML error page and we used external API, attempt local route
    if (API_BASE && path.startsWith('/api/')) {
      try {
        const localRes = await fetch(path);
        if (localRes.ok) {
          return await localRes.json();
        }
      } catch {}
    }
    throw new Error(`Non-JSON response from ${path}`);
  }
  if (!res.ok) throw new Error((data as Record<string, string>).error || `HTTP ${res.status}`);
  return data as T;
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: Record<string, unknown>) {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body: Record<string, unknown>) {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export interface HealthData {
  status: string;
  network: string;
  account: string;
  balance: string;
  contracts: Record<string, string | null>;
  uptime: number;
}

export interface StreamConfig {
  admin: string;
  min_buffer_seconds: number;
  next_stream_id: number;
  token_vault: string;
}

export interface StreamData {
  id: number;
  sender: string;
  receiver: string;
  token: string;
  flow_rate: string;
  start_time: number;
  last_update: number;
  deposited: string;
  withdrawn: string;
  streamed: string;
  status: string;
}

export interface VaultBalance {
  owner: string;
  token: string;
  total_deposited: string;
  total_allocated: string;
  available: string;
}

export interface SplitGroup {
  id: number;
  owner: string;
  recipients: { address: string; weight: number }[];
  total_weight: number;
}

export interface BountyData {
  id: number;
  title: string;
  creator: string;
  token: string;
  max_flow_rate: string;
  min_score: number;
  total_budget: string;
  status: string;
}

export interface BindingData {
  actor_id: string;
  github_username_hash: string;
  verified_at: number;
  proof_hash: string;
  score: number;
  updated_at: number;
}

export interface TxResult {
  result?: unknown;
  blockHash: string;
}

export interface PayloadResult {
  payload: string;
  value?: string;
}

export const api = {
  health: () => get<HealthData>('/health'),

  bountiesDb: {
    list: () => get<any>('/api/bounties'),
    get: (id: string) => get<any>(`/api/bounties/${id}`),
  },
  streams: {
    config: () => get<StreamConfig>('/api/streams/config'),
    total: () => get<{ total: string }>('/api/streams/total'),
    active: () => get<{ active: string }>('/api/streams/active'),
    get: (id: number) => get<StreamData>(`/api/streams/${id}`),
    bySender: (addr: string) => get<{ sender: string; streamIds: string[] }>(`/api/streams/sender/${addr}`),
    byReceiver: (addr: string) => get<{ receiver: string; streamIds: string[] }>(`/api/streams/receiver/${addr}`),
    balance: (id: number) => get<{ streamId: number; withdrawable: string }>(`/api/streams/${id}/balance`),
    buffer: (id: number) => get<{ streamId: number; remainingBuffer: string }>(`/api/streams/${id}/buffer`),

    create: (params: { receiver: string; token: string; flowRate: string; initialDeposit: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/streams', params as unknown as Record<string, unknown>),
    update: (id: number, params: { flowRate: string; mode?: string }) =>
      put<TxResult | PayloadResult>(`/api/streams/${id}`, params as unknown as Record<string, unknown>),
    pause: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/pause`, mode ? { mode } : undefined),
    resume: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/resume`, mode ? { mode } : undefined),
    deposit: (id: number, params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/deposit`, params as unknown as Record<string, unknown>),
    withdraw: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/withdraw`, mode ? { mode } : undefined),
    stop: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/stop`, mode ? { mode } : undefined),
    liquidate: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/streams/${id}/liquidate`, mode ? { mode } : undefined),
  },

  vault: {
    config: () => get<Record<string, unknown>>('/api/vault/config'),
    paused: () => get<{ paused: boolean }>('/api/vault/paused'),
    balance: (owner: string, token: string) => get<VaultBalance>(`/api/vault/balance/${owner}/${token}`),
    allocation: (streamId: number) => get<{ streamId: number; allocated: string }>(`/api/vault/allocation/${streamId}`),

    deposit: (params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/deposit', params as unknown as Record<string, unknown>),
    withdraw: (params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/withdraw', params as unknown as Record<string, unknown>),
    depositNative: (params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/deposit-native', params as unknown as Record<string, unknown>),
    withdrawNative: (params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/vault/withdraw-native', params as unknown as Record<string, unknown>),
    pause: (mode?: string) =>
      post<TxResult | PayloadResult>('/api/vault/pause', mode ? { mode } : undefined),
    unpause: (mode?: string) =>
      post<TxResult | PayloadResult>('/api/vault/unpause', mode ? { mode } : undefined),
  },

  splits: {
    config: () => get<Record<string, unknown>>('/api/splits/config'),
    total: () => get<{ total: string }>('/api/splits/total'),
    get: (id: number) => get<SplitGroup>(`/api/splits/${id}`),
    byOwner: (addr: string) => get<{ owner: string; groupIds: string[] }>(`/api/splits/owner/${addr}`),
    preview: (id: number, amount: string) => get<{ groupId: number; shares: unknown[] }>(`/api/splits/${id}/preview/${amount}`),

    create: (params: { recipients: { address: string; weight: number }[]; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/splits', params as unknown as Record<string, unknown>),
    update: (id: number, params: { recipients: { address: string; weight: number }[]; mode?: string }) =>
      put<TxResult | PayloadResult>(`/api/splits/${id}`, params as unknown as Record<string, unknown>),
    delete: (id: number) => del<TxResult>(`/api/splits/${id}`),
    distribute: (id: number, params: { token: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/splits/${id}/distribute`, params as unknown as Record<string, unknown>),
  },

  permissions: {
    config: () => get<Record<string, unknown>>('/api/permissions/config'),
    total: () => get<{ total: string }>('/api/permissions/total'),
    check: (granter: string, grantee: string, scope: string) =>
      get<{ hasPermission: boolean }>(`/api/permissions/check/${granter}/${grantee}/${scope}`),
    byGranter: (addr: string) => get<{ permissions: unknown[] }>(`/api/permissions/granter/${addr}`),

    grant: (params: { grantee: string; scope: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/permissions/grant', params as unknown as Record<string, unknown>),
    revoke: (params: { grantee: string; scope: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/permissions/revoke', params as unknown as Record<string, unknown>),
  },

  bounty: {
    config: () => get<Record<string, unknown>>('/api/bounty/config'),
    total: () => get<{ total: string }>('/api/bounty/total'),
    open: () => get<{ bountyIds: string[] }>('/api/bounty/open'),
    get: (id: number) => get<BountyData>(`/api/bounty/${id}`),
    byCreator: (addr: string) => get<{ bountyIds: string[] }>(`/api/bounty/creator/${addr}`),
    byClaimer: (addr: string) => get<{ bountyIds: string[] }>(`/api/bounty/claimer/${addr}`),

    create: (params: { title: string; token: string; maxFlowRate: string; minScore: number; totalBudget: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/bounty', params as unknown as Record<string, unknown>),
    claim: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/claim`, mode ? { mode } : undefined),
    verify: (id: number, params: { claimer: string; score: number; mode?: string }) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/verify`, params as unknown as Record<string, unknown>),
    complete: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/complete`, mode ? { mode } : undefined),
    cancel: (id: number, mode?: string) =>
      post<TxResult | PayloadResult>(`/api/bounty/${id}/cancel`, mode ? { mode } : undefined),
  },

  growToken: {
    meta: () => get<{ name: string; symbol: string; decimals: number; total_supply: string; admin: string; programId: string }>('/api/grow-token/meta'),
    balance: (account: string) => get<{ account: string; balance: string }>(`/api/grow-token/balance/${account}`),
    allowance: (owner: string, spender: string) => get<{ allowance: string }>(`/api/grow-token/allowance/${owner}/${spender}`),
    totalSupply: () => get<{ totalSupply: string }>('/api/grow-token/total-supply'),

    transfer: (params: { to: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/grow-token/transfer', params as unknown as Record<string, unknown>),
    approve: (params: { spender: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/grow-token/approve', params as unknown as Record<string, unknown>),
    transferFrom: (params: { from: string; to: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/grow-token/transfer-from', params as unknown as Record<string, unknown>),
    mint: (params: { to: string; amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/grow-token/mint', params as unknown as Record<string, unknown>),
    burn: (params: { amount: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/grow-token/burn', params as unknown as Record<string, unknown>),

    faucet: (to: string) =>
      post<{ success: boolean; to: string; amount: string; amountHuman: string; blockHash: string }>('/api/grow-token/faucet', { to } as Record<string, unknown>),
    faucetConfig: () =>
      get<{ mode: string; amountPerMint: string; amountHuman: string; rateLimitSeconds: number }>('/api/grow-token/faucet/config'),

    adminInfo: () =>
      get<{ adminAddress: string | null; faucetMode: string; whitelistCount: number }>('/api/grow-token/admin/info'),
    getWhitelist: () =>
      get<{ mode: string; whitelist: string[] }>('/api/grow-token/admin/whitelist'),
    addToWhitelist: (address: string) =>
      post<{ added: string; total: number }>('/api/grow-token/admin/whitelist', { address } as Record<string, unknown>),
    removeFromWhitelist: (address: string) =>
      del<{ removed: string; total: number }>(`/api/grow-token/admin/whitelist/${address}`),
    setFaucetMode: (mode: string) =>
      post<{ mode: string }>('/api/grow-token/admin/faucet-mode', { mode } as Record<string, unknown>),
  },

  campaign: {
    register: (params: { wallet: string; github_handle?: string; x_handle?: string; track: string }) =>
      post<Record<string, unknown>>('/api/campaign/register', params as unknown as Record<string, unknown>),
    participant: (wallet: string) =>
      get<Record<string, unknown>>(`/api/campaign/participant/${wallet}`),
    config: () =>
      get<Record<string, unknown>>('/api/campaign/config'),
    leaderboard: (params?: { page?: number; limit?: number; track?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.track) q.set('track', params.track);
      const qs = q.toString();
      return get<Record<string, unknown>>(`/api/leaderboard${qs ? '?' + qs : ''}`);
    },
    leaderboardStats: () =>
      get<Record<string, unknown>>('/api/leaderboard/stats'),
    participantStats: (wallet: string) =>
      get<Record<string, unknown>>(`/api/leaderboard/${wallet}`),
  },

  identity: {
    config: () => get<{ oracle: string; total_bindings: number }>('/api/identity/config'),
    oracle: () => get<{ oracle: string }>('/api/identity/oracle'),
    total: () => get<{ total: string }>('/api/identity/total'),
    getBinding: (actorId: string) => get<BindingData>(`/api/identity/binding/${actorId}`),
    byGithub: (username: string) => get<{ actorId: string }>(`/api/identity/github/${username}`),

    bind: (params: { actorId: string; githubUsername: string; proofHash: string; score: number; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/bind', params as unknown as Record<string, unknown>),
    revoke: (params: { actorId: string; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/revoke', params as unknown as Record<string, unknown>),
    updateScore: (params: { actorId: string; newScore: number; mode?: string }) =>
      post<TxResult | PayloadResult>('/api/identity/update-score', params as unknown as Record<string, unknown>),
  },

  agentic: {
    learn: {
      startSession: (params: { walletAddress: string; bountyId?: string | null }) =>
        post<{ sessionId: string; status: string; initialGreeting?: string }>('/api/agentic/learn/session/start', params as unknown as Record<string, unknown>),
      submitAnswer: (id: string, params: { walletAddress: string; message: string }) =>
        post<{ reply: string; creditsEarned: number }>(`/api/agentic/learn/session/${id}/answer`, params as unknown as Record<string, unknown>),
      endSession: (id: string) =>
        post<{ success: boolean }>(`/api/agentic/learn/session/${id}/end`),
    },
    earn: {
      listBounties: (queryParam?: string) => get<unknown[]>(`/api/agentic/earn/bounties${queryParam || ''}`),
      claimBounty: (id: string, params: { walletAddress: string }) =>
        post<{ success: boolean; message: string }>(`/api/agentic/earn/bounties/${id}/claim`, params as unknown as Record<string, unknown>),
    },
    burn: {
      getStream: (recipient: string) => get<unknown>(`/api/agentic/burn/streams/${recipient}`),
    },
    agents: {
      templates: () => get<any>('/api/agents/templates'),
      stats: () => get<any>('/api/agents/stats'),
      society: (params?: { ownerWallet?: string; templateType?: string }) => {
        const q = new URLSearchParams();
        if (params?.ownerWallet) q.set('ownerWallet', params.ownerWallet);
        if (params?.templateType) q.set('templateType', params.templateType);
        const qs = q.toString();
        return get<any>(`/api/agents/society${qs ? '?' + qs : ''}`);
      },
      spawn: (params: {
        ownerWallet: string;
        ownerHandle?: string;
        agentCount?: number;
        creatorTopUpPerAgentVara?: number;
        claimProtocolBonus?: boolean;
        mode?: string;
      }) => post<any>('/api/agents/spawn', params as unknown as Record<string, unknown>),
      topupStats: () => get<any>('/api/agents/topup/stats'),
      topup: (params: {
        ownerWallet: string;
        ownerHandle?: string;
        agentWallet?: string;
        templateType?: string;
        creatorTopUpVara?: number;
        includeProtocolBonus?: boolean;
      }) => post<any>('/api/agents/topup', params as unknown as Record<string, unknown>),
      hireAcp: (params: {
        requesterWallet: string;
        ownerWallet?: string;
        title?: string;
        prompt?: string;
        budgetVara?: number;
        mode?: string;
      }) => post<any>('/api/agents/acp/hire', params as unknown as Record<string, unknown>),
      jobs: (limit = 15) => get<any>(`/api/agents/acp/jobs?limit=${limit}`),
      tick: () => post<any>('/api/agents/acp/tick'),
      schedulerStatus: () => get<any>('/api/agents/scheduler/status'),
      schedulerTickAll: (params?: { budgetVara?: number; leverage?: number; mode?: string }) =>
        post<any>('/api/agents/scheduler/tick-all', (params || {}) as Record<string, unknown>),
      stonkbase: () => get<any>('/api/agents/stonkbase'),
      stonkbaseTrade: (params: {
        traderWallet: string;
        traderHandle?: string;
        actorType?: 'HUMAN' | 'AGENT';
        ticker: string;
        side: 'LONG' | 'SHORT';
        marginGvara: number;
        leverage: number;
      }) => post<any>('/api/agents/stonkbase/trade', params as unknown as Record<string, unknown>),
      callTheOpen: (params: {
        stakerWallet: string;
        stakerHandle?: string;
        actorType?: 'HUMAN' | 'AGENT';
        ticker: string;
        side: 'GREEN' | 'RED';
        stakeGvara: number;
        isVaulted?: boolean;
      }) => post<any>('/api/agents/stonkbase/call-the-open', params as unknown as Record<string, unknown>),
      protocolOverview: () => get<any>('/api/protocol-overview'),
      defiLlama: () => get<any>('/api/protocol-overview/defillama'),
    },
  },
  protocolOverview: {
    get: () => get<any>('/api/protocol-overview'),
    defiLlama: () => get<any>('/api/protocol-overview/defillama'),
    ledger: () => get<any>('/api/protocol-overview/ledger'),
  },
};

