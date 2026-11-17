#![no_std]
#![allow(static_mut_refs)]

use sails_rs::{
    collections::BTreeMap,
    gstd::{exec, msg},
    prelude::*,
};

pub const MAX_MOVE_BPS: u64 = 800; // ±8% bounded oracle move guardrail
/// Positions can only open/close against an oracle price pushed within this window.
pub const MAX_ORACLE_AGE_SECS: u64 = 6 * 60 * 60;
pub const BPS: u128 = 10_000;
pub const SPOT_FEE_BPS: u128 = 30; // 0.30% total spot CLOB trade fee (25 bps maker/LP + 5 bps protocol)
pub const PERPS_FEE_BPS: u128 = 10; // 0.10% perpetuals open/close fee on notional

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct OracleFeed {
    pub ticker: String,
    pub fair_value_e8: u64,
    pub confidence: u8,
    pub updated_at: u64,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct SpotOrder {
    pub id: u64,
    pub maker: ActorId,
    pub pair: String,
    pub is_buy: bool,
    pub price_e8: u64,
    pub amount_vara: u128,
    pub filled_vara: u128,
    pub is_active: bool,
    pub created_at: u64,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct SpotTrade {
    pub id: u64,
    pub order_id: u64,
    pub pair: String,
    pub maker: ActorId,
    pub taker: ActorId,
    pub price_e8: u64,
    pub amount_vara: u128,
    pub fee_vara: u128,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct StockPosition {
    pub id: u64,
    pub trader: ActorId,
    pub is_agent_actor: bool,
    pub ticker: String,
    pub is_long: bool,
    pub margin_gvara: u128,
    pub leverage: u8,
    pub notional_gvara: u128,
    pub entry_price_e8: u64,
    pub exit_price_e8: u64,
    pub pnl_gvara: i128,
    pub is_open: bool,
    pub opened_at: u64,
    pub closed_at: u64,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct CallTheOpenRound {
    pub id: u64,
    pub ticker: String,
    pub session_yyyymmdd: u32,
    pub strike_e8: u64,
    pub open_price_e8: u64,
    pub open_time: u64,
    pub lock_time: u64,
    pub stake_green: u128,
    pub stake_red: u128,
    pub shares_green: u128,
    pub shares_red: u128,
    pub settled: bool,
    pub outcome: u8,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct VolumeStats {
    pub spot_volume_vara: u128,
    pub spot_fees_vara: u128,
    pub spot_trades_count: u64,
    pub human_margin_volume: u128,
    pub human_notional_volume: u128,
    pub agent_margin_volume: u128,
    pub agent_notional_volume: u128,
    pub total_positions: u64,
    pub total_rounds: u64,
}

static mut STATE: Option<StonkBaseState> = None;

pub struct StonkBaseState {
    pub admin: ActorId,
    pub gvara_token: ActorId,
    pub token_vault: ActorId,
    pub splits_router: ActorId,
    pub feeds: BTreeMap<String, OracleFeed>,
    pub spot_orders: BTreeMap<u64, SpotOrder>,
    pub spot_trades: BTreeMap<u64, SpotTrade>,
    pub positions: BTreeMap<u64, StockPosition>,
    pub rounds: BTreeMap<u64, CallTheOpenRound>,
    pub next_order_id: u64,
    pub next_trade_id: u64,
    pub next_pos_id: u64,
    pub next_round_id: u64,
    pub spot_volume_vara: u128,
    pub spot_fees_vara: u128,
    pub human_margin_volume: u128,
    pub human_notional_volume: u128,
    pub agent_margin_volume: u128,
    pub agent_notional_volume: u128,
}

impl StonkBaseState {
    fn get() -> &'static mut Self {
        unsafe { STATE.as_mut().expect("StonkBaseState not initialized") }
    }
}

pub struct StonkBaseProgram;

#[program]
impl StonkBaseProgram {
    pub fn new(
        admin: ActorId,
        gvara_token: ActorId,
        token_vault: ActorId,
        splits_router: ActorId,
    ) -> Self {
        unsafe {
            STATE = Some(StonkBaseState {
                admin,
                gvara_token,
                token_vault,
                splits_router,
                feeds: BTreeMap::new(),
                spot_orders: BTreeMap::new(),
                spot_trades: BTreeMap::new(),
                positions: BTreeMap::new(),
                rounds: BTreeMap::new(),
                next_order_id: 1,
                next_trade_id: 1,
                next_pos_id: 1,
                next_round_id: 1,
                spot_volume_vara: 0,
                spot_fees_vara: 0,
                human_margin_volume: 0,
                human_notional_volume: 0,
                agent_margin_volume: 0,
                agent_notional_volume: 0,
            });
        }
        Self
    }

    pub fn stonk_base_service(&self) -> StonkBaseService {
        StonkBaseService::new()
    }
}

pub struct StonkBaseService;

impl StonkBaseService {
    pub fn new() -> Self {
        Self
    }
}

#[service]
impl StonkBaseService {
    // --- 24/7 Bounded Oracle (±8% / 800 bps maxMoveBps) ---
    #[export]
    pub fn push_oracle_prices(
        &mut self,
        tickers: Vec<String>,
        prices_e8: Vec<u64>,
        confidences: Vec<u8>,
    ) -> bool {
        let state = StonkBaseState::get();
        // SECURITY: only the admin / keeper may publish prices (previously callable by anyone).
        assert!(msg::source() == state.admin, "Only admin keeper can push oracle prices");
        let now = exec::block_timestamp() / 1000;
        let len = tickers.len().min(prices_e8.len()).min(confidences.len());
        for i in 0..len {
            let t = tickers[i].clone();
            let mut proposed = prices_e8[i];
            let conf = confidences[i].min(100);
            if let Some(prev) = state.feeds.get(&t) {
                if prev.fair_value_e8 > 0 {
                    let diff = proposed.abs_diff(prev.fair_value_e8);
                    let max_delta =
                        (prev.fair_value_e8 as u128 * MAX_MOVE_BPS as u128 / 10_000) as u64;
                    if diff > max_delta {
                        proposed = if proposed > prev.fair_value_e8 {
                            prev.fair_value_e8 + max_delta
                        } else {
                            prev.fair_value_e8 - max_delta
                        };
                    }
                }
            }
            state.feeds.insert(
                t.clone(),
                OracleFeed {
                    ticker: t,
                    fair_value_e8: proposed,
                    confidence: conf,
                    updated_at: now,
                },
            );
        }
        true
    }

    // --- Spot CLOB Orderbook (DEXs Volume) ---
    #[export]
    pub fn place_spot_order(
        &mut self,
        pair: String,
        is_buy: bool,
        price_e8: u64,
        amount_vara: u128,
    ) -> u64 {
        assert!(!pair.is_empty(), "Pair cannot be empty");
        assert!(price_e8 > 0, "Price must be > 0");
        assert!(amount_vara > 0, "Amount must be > 0");

        let state = StonkBaseState::get();
        let maker = msg::source();
        let now = exec::block_timestamp() / 1000;
        let order_id = state.next_order_id;
        state.next_order_id += 1;

        // Notify GrowStreams TokenVault to reserve maker orderbook liquidity allocation
        let _ = msg::send(
            state.token_vault,
            ("VaultService", "ReserveOrderMargin", maker, amount_vara),
            0,
        );

        state.spot_orders.insert(
            order_id,
            SpotOrder {
                id: order_id,
                maker,
                pair,
                is_buy,
                price_e8,
                amount_vara,
                filled_vara: 0,
                is_active: true,
                created_at: now,
            },
        );
        order_id
    }

    #[export]
    pub fn fill_spot_order(&mut self, order_id: u64, fill_amount_vara: u128) -> u64 {
        assert!(fill_amount_vara > 0, "Fill amount must be > 0");
        let state = StonkBaseState::get();
        let taker = msg::source();
        let now = exec::block_timestamp() / 1000;

        let order = state.spot_orders.get_mut(&order_id).expect("Order not found");
        assert!(order.is_active, "Order is not active");
        assert!(order.maker != taker, "Self-trade forbidden: maker != taker");

        let remaining = order.amount_vara.saturating_sub(order.filled_vara);
        assert!(remaining > 0, "Order already filled");
        let actual_fill = fill_amount_vara.min(remaining);
        order.filled_vara = order.filled_vara.saturating_add(actual_fill);
        if order.filled_vara >= order.amount_vara {
            order.is_active = false;
        }

        let maker = order.maker;
        let pair = order.pair.clone();
        let price_e8 = order.price_e8;
        let fee_vara = actual_fill.saturating_mul(SPOT_FEE_BPS) / BPS;
        let maker_rebate = (fee_vara * 25) / 30;
        let protocol_fee = fee_vara.saturating_sub(maker_rebate);

        // Route settlement & fee split through GrowStreams TokenVault & SplitsRouter
        let _ = msg::send(
            state.token_vault,
            (
                "VaultService",
                "SettleSpotFill",
                maker,
                taker,
                actual_fill,
                maker_rebate,
                protocol_fee,
            ),
            0,
        );

        let trade_id = state.next_trade_id;
        state.next_trade_id += 1;

        state.spot_volume_vara = state.spot_volume_vara.saturating_add(actual_fill);
        state.spot_fees_vara = state.spot_fees_vara.saturating_add(fee_vara);

        state.spot_trades.insert(
            trade_id,
            SpotTrade {
                id: trade_id,
                order_id,
                pair,
                maker,
                taker,
                price_e8,
                amount_vara: actual_fill,
                fee_vara,
                timestamp: now,
            },
        );
        trade_id
    }

    // --- 1x–5x Stock & Perps Desk in gVARA (Perps Volume & Open Interest) ---
    #[export]
    pub fn open_stock_position(
        &mut self,
        ticker: String,
        is_long: bool,
        margin_gvara: u128,
        leverage: u8,
        is_agent_actor: bool,
        _splits_group_id: u64,
    ) -> u64 {
        assert!(!ticker.is_empty(), "Ticker cannot be empty");
        assert!(margin_gvara > 0, "Margin must be > 0");
        let state = StonkBaseState::get();
        let caller = msg::source();
        let now = exec::block_timestamp() / 1000;
        let lev = leverage.clamp(1, 5);
        let notional = margin_gvara.saturating_mul(lev as u128);
        // SECURITY: no silent $100 default — a fresh oracle price must exist for this ticker.
        let feed = state.feeds.get(&ticker).expect("No oracle feed for ticker");
        assert!(feed.fair_value_e8 > 0, "Oracle price is zero");
        assert!(now.saturating_sub(feed.updated_at) <= MAX_ORACLE_AGE_SECS, "Oracle price is stale");
        let entry_price = feed.fair_value_e8;

        let id = state.next_pos_id;
        state.next_pos_id += 1;
        let exec_fee = notional.saturating_mul(PERPS_FEE_BPS) / BPS;

        // Lock gVARA margin collateral & collect 10 bps execution fee via GrowStreams TokenVault
        let _ = msg::send(
            state.token_vault,
            (
                "VaultService",
                "LockPerpsMargin",
                caller,
                margin_gvara,
                exec_fee,
            ),
            0,
        );

        if is_agent_actor {
            state.agent_margin_volume = state.agent_margin_volume.saturating_add(margin_gvara);
            state.agent_notional_volume = state.agent_notional_volume.saturating_add(notional);
        } else {
            state.human_margin_volume = state.human_margin_volume.saturating_add(margin_gvara);
            state.human_notional_volume = state.human_notional_volume.saturating_add(notional);
        }

        state.positions.insert(
            id,
            StockPosition {
                id,
                trader: caller,
                is_agent_actor,
                ticker,
                is_long,
                margin_gvara,
                leverage: lev,
                notional_gvara: notional,
                entry_price_e8: entry_price,
                exit_price_e8: 0,
                pnl_gvara: 0,
                is_open: true,
                opened_at: now,
                closed_at: 0,
            },
        );
        id
    }

    #[export]
    pub fn close_stock_position(&mut self, position_id: u64, exit_price_e8: u64) -> i128 {
        let state = StonkBaseState::get();
        let now = exec::block_timestamp() / 1000;
        let caller = msg::source();
        let pos = state.positions.get_mut(&position_id).expect("Position not found");
        assert!(pos.is_open, "Position already closed");
        // SECURITY: only the position owner (or admin) may close it.
        assert!(caller == pos.trader || caller == state.admin, "Not position owner");

        // SECURITY: exit price comes from the oracle, never from caller input.
        let _ = exit_price_e8; // kept for ABI compatibility
        let feed = state.feeds.get(&pos.ticker).expect("No oracle feed for ticker");
        assert!(now.saturating_sub(feed.updated_at) <= MAX_ORACLE_AGE_SECS, "Oracle price is stale");
        let exit = feed.fair_value_e8;
        let entry = pos.entry_price_e8.max(1);
        let diff_signed: i128 = if pos.is_long {
            (exit as i128) - (entry as i128)
        } else {
            (entry as i128) - (exit as i128)
        };
        let pnl: i128 = (pos.notional_gvara as i128)
            .saturating_mul(diff_signed)
            / (entry as i128);

        pos.exit_price_e8 = exit;
        pos.pnl_gvara = pnl;
        pos.is_open = false;
        pos.closed_at = now;
        pnl
    }

    // --- Queries ---
    #[export]
    pub fn get_oracle_feed(&self, ticker: String) -> Option<OracleFeed> {
        StonkBaseState::get().feeds.get(&ticker).cloned()
    }

    #[export]
    pub fn get_spot_order(&self, order_id: u64) -> Option<SpotOrder> {
        StonkBaseState::get().spot_orders.get(&order_id).cloned()
    }

    #[export]
    pub fn get_spot_trade(&self, trade_id: u64) -> Option<SpotTrade> {
        StonkBaseState::get().spot_trades.get(&trade_id).cloned()
    }

    #[export]
    pub fn get_spot_trades_count(&self) -> u64 {
        StonkBaseState::get().next_trade_id - 1
    }

    #[export]
    pub fn get_spot_orders_count(&self) -> u64 {
        StonkBaseState::get().next_order_id - 1
    }

    #[export]
    pub fn get_position(&self, position_id: u64) -> Option<StockPosition> {
        StonkBaseState::get().positions.get(&position_id).cloned()
    }

    #[export]
    pub fn get_positions_count(&self) -> u64 {
        StonkBaseState::get().next_pos_id - 1
    }

    #[export]
    pub fn get_volume_stats(&self) -> VolumeStats {
        let state = StonkBaseState::get();
        VolumeStats {
            spot_volume_vara: state.spot_volume_vara,
            spot_fees_vara: state.spot_fees_vara,
            spot_trades_count: state.next_trade_id - 1,
            human_margin_volume: state.human_margin_volume,
            human_notional_volume: state.human_notional_volume,
            agent_margin_volume: state.agent_margin_volume,
            agent_notional_volume: state.agent_notional_volume,
            total_positions: state.next_pos_id - 1,
            total_rounds: state.next_round_id - 1,
        }
    }
}
