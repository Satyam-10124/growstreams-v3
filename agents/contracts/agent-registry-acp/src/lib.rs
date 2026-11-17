#![no_std]

use gstd::{exec, msg, prelude::*, ActorId, ReservationId};
use parity_scale_codec::{Decode, Encode};
use sails_rs::prelude::*;
use scale_info::TypeInfo;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo)]
pub enum AgentTemplate {
    Trader,
    Sde,
    Art,
    XMarketing,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct AgentProfile {
    pub agent_id: u64,
    pub owner: ActorId,
    pub agent_actor: ActorId,
    pub template: AgentTemplate,
    pub name: String,
    pub hire_fee_vara: u128,
    pub splits_group_id: u64,
    pub heartbeat_interval_blocks: u32,
    pub total_jobs_completed: u64,
    pub total_volume_routed: u128,
    pub active: bool,
    pub registered_at: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo)]
pub enum AcpJobStatus {
    Escrowed,
    InProgress,
    Subcontracted,
    Delivered,
    Disputed,
    Cancelled,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct AcpJobOrder {
    pub job_id: u64,
    pub requester: ActorId,
    pub lead_agent_id: u64,
    pub lead_agent_actor: ActorId,
    pub budget_vara: u128,
    pub stream_id: Option<u64>,
    pub splits_group_id: u64,
    pub deliverable_hash: Option<String>,
    pub status: AcpJobStatus,
    pub created_at: u64,
    pub completed_at: Option<u64>,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct RegistryConfig {
    pub admin: ActorId,
    pub stream_core: ActorId,
    pub token_vault: ActorId,
    pub splits_router: ActorId,
    pub permission_manager: ActorId,
    pub identity_registry: ActorId,
    pub total_agents: u64,
    pub total_jobs: u64,
    pub total_volume_vara: u128,
}

#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub enum AgentSocietyEvents {
    AgentSpawned {
        agent_id: u64,
        owner: ActorId,
        agent_actor: ActorId,
        template: AgentTemplate,
        name: String,
        timestamp: u64,
    },
    FourAgentSuiteSpawned {
        owner: ActorId,
        agent_ids: Vec<u64>,
        splits_group_id: u64,
        timestamp: u64,
    },
    AcpJobCreated {
        job_id: u64,
        requester: ActorId,
        lead_agent_id: u64,
        budget_vara: u128,
        timestamp: u64,
    },
    AgentSubcontracted {
        job_id: u64,
        from_agent_id: u64,
        to_agent_id: u64,
        amount_vara: u128,
        memo: String,
        timestamp: u64,
    },
    AcpJobDelivered {
        job_id: u64,
        lead_agent_id: u64,
        deliverable_hash: String,
        payout_vara: u128,
        timestamp: u64,
    },
    AutonomousTickExecuted {
        agent_id: u64,
        agent_actor: ActorId,
        next_tick_in_blocks: u32,
        timestamp: u64,
    },
}

struct AgentSocietyState {
    config: RegistryConfig,
    agents: Vec<AgentProfile>,
    jobs: Vec<AcpJobOrder>,
    gas_reservations: Vec<(u64, ReservationId)>,
}

static mut STATE: Option<AgentSocietyState> = None;

fn state_mut() -> &'static mut AgentSocietyState {
    unsafe { STATE.as_mut().expect("AgentSocietyState not initialized") }
}

fn state_ref() -> &'static AgentSocietyState {
    unsafe { STATE.as_ref().expect("AgentSocietyState not initialized") }
}

pub struct AgentSocietyService;

#[service(events = AgentSocietyEvents)]
impl AgentSocietyService {
    pub fn new() -> Self {
        Self
    }

    pub fn spawn_agent(
        &mut self,
        agent_actor: ActorId,
        template: AgentTemplate,
        name: String,
        hire_fee_vara: u128,
        splits_group_id: u64,
        heartbeat_interval_blocks: u32,
    ) -> Result<u64, String> {
        let caller = msg::source();
        let now = exec::block_timestamp();
        let st = state_mut();

        st.config.total_agents += 1;
        let agent_id = st.config.total_agents;

        let profile = AgentProfile {
            agent_id,
            owner: caller,
            agent_actor,
            template,
            name: name.clone(),
            hire_fee_vara,
            splits_group_id,
            heartbeat_interval_blocks,
            total_jobs_completed: 0,
            total_volume_routed: 0,
            active: true,
            registered_at: now,
        };

        st.agents.push(profile);

        let _ = self.notify_on(AgentSocietyEvents::AgentSpawned {
            agent_id,
            owner: caller,
            agent_actor,
            template,
            name,
            timestamp: now,
        });

        Ok(agent_id)
    }

    pub fn spawn_four_agent_suite(
        &mut self,
        trader_actor: ActorId,
        sde_actor: ActorId,
        art_actor: ActorId,
        x_actor: ActorId,
        owner_handle: String,
        splits_group_id: u64,
    ) -> Result<Vec<u64>, String> {
        let caller = msg::source();
        let now = exec::block_timestamp();
        let specs = [
            (trader_actor, AgentTemplate::Trader, format!("{}_Trader_Agent", owner_handle), 10_000_000_000_000u128),
            (sde_actor, AgentTemplate::Sde, format!("{}_SDE_Agent", owner_handle), 15_000_000_000_000u128),
            (art_actor, AgentTemplate::Art, format!("{}_Art_Agent", owner_handle), 5_000_000_000_000u128),
            (x_actor, AgentTemplate::XMarketing, format!("{}_X_Agent", owner_handle), 5_000_000_000_000u128),
        ];

        let mut ids = Vec::with_capacity(4);
        for (actor, tpl, name, fee) in specs {
            let id = self.spawn_agent(actor, tpl, name, fee, splits_group_id, 1200)?;
            ids.push(id);
        }

        let _ = self.notify_on(AgentSocietyEvents::FourAgentSuiteSpawned {
            owner: caller,
            agent_ids: ids.clone(),
            splits_group_id,
            timestamp: now,
        });

        Ok(ids)
    }

    pub fn create_acp_job(
        &mut self,
        lead_agent_id: u64,
        stream_id: Option<u64>,
        splits_group_id: u64,
        _task_uri: String,
    ) -> Result<u64, String> {
        let caller = msg::source();
        let attached_vara = msg::value();
        let now = exec::block_timestamp();
        let st = state_mut();

        let agent = st
            .agents
            .iter()
            .find(|a| a.agent_id == lead_agent_id && a.active)
            .ok_or_else(|| "Lead agent not found or inactive".to_string())?
            .clone();

        st.config.total_jobs += 1;
        st.config.total_volume_vara = st.config.total_volume_vara.saturating_add(attached_vara);
        let job_id = st.config.total_jobs;

        let order = AcpJobOrder {
            job_id,
            requester: caller,
            lead_agent_id,
            lead_agent_actor: agent.agent_actor,
            budget_vara: attached_vara,
            stream_id,
            splits_group_id,
            deliverable_hash: None,
            status: AcpJobStatus::Escrowed,
            created_at: now,
            completed_at: None,
        };
        st.jobs.push(order);

        let _ = self.notify_on(AgentSocietyEvents::AcpJobCreated {
            job_id,
            requester: caller,
            lead_agent_id,
            budget_vara: attached_vara,
            timestamp: now,
        });

        Ok(job_id)
    }

    pub fn subcontract_agent(
        &mut self,
        job_id: u64,
        from_agent_id: u64,
        to_agent_id: u64,
        sub_payment_vara: u128,
        memo: String,
    ) -> Result<(), String> {
        let now = exec::block_timestamp();
        let st = state_mut();

        let to_actor = st
            .agents
            .iter()
            .find(|a| a.agent_id == to_agent_id)
            .map(|a| a.agent_actor)
            .ok_or_else(|| "Target subcontracted agent not found".to_string())?;

        if let Some(job) = st.jobs.iter_mut().find(|j| j.job_id == job_id) {
            job.status = AcpJobStatus::Subcontracted;
        }

        for agent in st.agents.iter_mut() {
            if agent.agent_id == from_agent_id || agent.agent_id == to_agent_id {
                agent.total_volume_routed = agent.total_volume_routed.saturating_add(sub_payment_vara);
            }
        }
        st.config.total_volume_vara = st.config.total_volume_vara.saturating_add(sub_payment_vara);

        if sub_payment_vara > 0 && exec::value_available() >= sub_payment_vara {
            let _ = msg::send(to_actor, b"ACP_SUBCONTRACT_PAYOUT", sub_payment_vara);
        }

        let _ = self.notify_on(AgentSocietyEvents::AgentSubcontracted {
            job_id,
            from_agent_id,
            to_agent_id,
            amount_vara: sub_payment_vara,
            memo,
            timestamp: now,
        });

        Ok(())
    }

    pub fn deliver_acp_job(
        &mut self,
        job_id: u64,
        deliverable_hash: String,
    ) -> Result<(), String> {
        let now = exec::block_timestamp();
        let st = state_mut();

        let (lead_agent_id, lead_actor, payout) = {
            let job = st
                .jobs
                .iter_mut()
                .find(|j| j.job_id == job_id)
                .ok_or_else(|| "ACP job not found".to_string())?;
            job.status = AcpJobStatus::Delivered;
            job.deliverable_hash = Some(deliverable_hash.clone());
            job.completed_at = Some(now);
            (job.lead_agent_id, job.lead_agent_actor, job.budget_vara)
        };

        if let Some(agent) = st.agents.iter_mut().find(|a| a.agent_id == lead_agent_id) {
            agent.total_jobs_completed += 1;
            agent.total_volume_routed = agent.total_volume_routed.saturating_add(payout);
        }

        if payout > 0 && exec::value_available() >= payout {
            let _ = msg::send(lead_actor, b"ACP_JOB_SETTLEMENT", payout);
        }

        let _ = self.notify_on(AgentSocietyEvents::AcpJobDelivered {
            job_id,
            lead_agent_id,
            deliverable_hash,
            payout_vara: payout,
            timestamp: now,
        });

        Ok(())
    }

    pub fn reserve_agent_gas(
        &mut self,
        agent_id: u64,
        reservation_amount: u64,
        duration_blocks: u32,
    ) -> Result<(), String> {
        let reservation_id = ReservationId::reserve(reservation_amount, duration_blocks)
            .map_err(|e| format!("Failed to reserve agent gas: {:?}", e))?;
        state_mut().gas_reservations.push((agent_id, reservation_id));
        Ok(())
    }

    pub fn schedule_autonomous_tick(
        &mut self,
        agent_id: u64,
        delay_blocks: u32,
    ) -> Result<(), String> {
        let program_id = exec::program_id();
        let payload = (
            "AgentSocietyService",
            "ExecuteAutonomousTick",
            agent_id,
        )
            .encode();

        msg::send_bytes_delayed(program_id, payload, 0, delay_blocks)
            .map_err(|e| format!("Failed to schedule delayed tick: {:?}", e))?;
        Ok(())
    }

    pub fn execute_autonomous_tick(&mut self, agent_id: u64) -> Result<(), String> {
        let now = exec::block_timestamp();
        let st = state_mut();
        let agent = st
            .agents
            .iter()
            .find(|a| a.agent_id == agent_id && a.active)
            .ok_or_else(|| "Agent not found or inactive".to_string())?
            .clone();

        let _ = self.notify_on(AgentSocietyEvents::AutonomousTickExecuted {
            agent_id,
            agent_actor: agent.agent_actor,
            next_tick_in_blocks: agent.heartbeat_interval_blocks,
            timestamp: now,
        });

        Ok(())
    }

    pub fn get_agent(&self, agent_id: u64) -> Option<AgentProfile> {
        state_ref()
            .agents
            .iter()
            .find(|a| a.agent_id == agent_id)
            .cloned()
    }

    pub fn get_owner_agents(&self, owner: ActorId) -> Vec<AgentProfile> {
        state_ref()
            .agents
            .iter()
            .filter(|a| a.owner == owner)
            .cloned()
            .collect()
    }

    pub fn get_all_agents(&self, offset: u32, limit: u32) -> Vec<AgentProfile> {
        state_ref()
            .agents
            .iter()
            .skip(offset as usize)
            .take(limit as usize)
            .cloned()
            .collect()
    }

    pub fn get_acp_job(&self, job_id: u64) -> Option<AcpJobOrder> {
        state_ref()
            .jobs
            .iter()
            .find(|j| j.job_id == job_id)
            .cloned()
    }

    pub fn get_config(&self) -> RegistryConfig {
        state_ref().config.clone()
    }
}

pub struct AgentRegistryAcpProgram;

#[program]
impl AgentRegistryAcpProgram {
    pub fn new(
        admin: ActorId,
        stream_core: ActorId,
        token_vault: ActorId,
        splits_router: ActorId,
        permission_manager: ActorId,
        identity_registry: ActorId,
    ) -> Self {
        unsafe {
            STATE = Some(AgentSocietyState {
                config: RegistryConfig {
                    admin,
                    stream_core,
                    token_vault,
                    splits_router,
                    permission_manager,
                    identity_registry,
                    total_agents: 0,
                    total_jobs: 0,
                    total_volume_vara: 0,
                },
                agents: Vec::new(),
                jobs: Vec::new(),
                gas_reservations: Vec::new(),
            });
        }
        Self
    }

    pub fn agent_society_service(&self) -> AgentSocietyService {
        AgentSocietyService::new()
    }
}
