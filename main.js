// ============================================================
// GAMESTATE
// ============================================================
const GameState = {
	station_name: "PERIPHERY-9",
	guildmaster_name: "UNKNOWN",
	cycle: 1,
	game_active: false,

	resources: {
		credits:   { value: 50000, delta: 0,    max: 100000, label: "CREDITS" },
		fuel:      { value: 8000,  delta: -50,  max: 20000,  label: "FUEL" },
		food:      { value: 12000, delta: -100, max: 30000,  label: "FOOD" },
		munitions: { value: 3000,  delta: 0,    max: 10000,  label: "MUNITIONS" },
		parts:     { value: 2500,  delta: 0,    max: 8000,   label: "PARTS" },
		medicine:  { value: 1500,  delta: -10,  max: 5000,   label: "MEDICINE" },
	},
	crew_total: 10000,
	morale: 0.7,
	threat_level: 0.3,
	station_hull: 1.0,
	hull_integrity: 1.0,

	gm_alive: true,
	gm_health: 1.0,
	gm_political_heat: 0.0,
	gm_personal_threat: 0.0,
	gm_imprisoned: false,

	sectors: {
		travel: {
			name: "Travel", status: "nominal", crew_min: 200, crew_assigned: 240,
			subsectors: {
				tourism:     { name: "Tourism Operations", crew: 80, status: "nominal" },
				short_range: { name: "Short Range",        crew: 90, status: "nominal" },
				long_range:  { name: "Long Range",         crew: 70, status: "nominal" },
			},
		},
		trade_logistics: {
			name: "Trade & Logistics", status: "nominal", crew_min: 400, crew_assigned: 450,
			subsectors: {
				imports:      { name: "Imports",      crew: 120, status: "nominal" },
				exports:      { name: "Exports",      crew: 110, status: "nominal" },
				supply_chain: { name: "Supply Chain", crew: 130, status: "nominal" },
				rationing:    { name: "Rationing",    crew: 90,  status: "nominal" },
			},
		},
		exploration: {
			name: "Exploration", status: "nominal", crew_min: 150, crew_assigned: 180,
			subsectors: {
				defensive:   { name: "Defensive Positioning", crew: 100, status: "nominal" },
				expeditions: { name: "Paid Expeditions",      crew: 80,  status: "nominal" },
			},
		},
		security_intel: {
			name: "Security & Intel", status: "nominal", crew_min: 300, crew_assigned: 320,
			subsectors: {
				armoury:           { name: "Armoury",            crew: 70, status: "nominal" },
				station_security:  { name: "Station Security",   crew: 90, status: "nominal" },
				espionage:         { name: "Espionage",          crew: 80, status: "nominal" },
				counterintel:      { name: "Counterintelligence", crew: 80, status: "nominal" },
			},
		},
		politics_info: {
			name: "Politics & Info", status: "nominal", crew_min: 200, crew_assigned: 220,
			subsectors: {
				guild_relations:    { name: "Guild Relations",    crew: 60, status: "nominal" },
				external_diplomacy: { name: "External Diplomacy", crew: 50, status: "nominal" },
				propaganda:         { name: "Propaganda",         crew: 60, status: "nominal" },
				narrative_control:  { name: "Narrative Control",  crew: 50, status: "nominal" },
			},
		},
		labor_affairs: {
			name: "Labor & Affairs", status: "nominal", crew_min: 250, crew_assigned: 280,
			subsectors: {
				union_councils:       { name: "Union Councils",       crew: 140, status: "nominal" },
				workforce_management: { name: "Workforce Management", crew: 140, status: "nominal" },
			},
		},
		engineering: {
			name: "Engineering", status: "nominal", crew_min: 350, crew_assigned: 380,
			subsectors: {
				system_repair: { name: "System Repair", crew: 200, status: "nominal" },
				fabrication:   { name: "Fabrication",   crew: 180, status: "nominal" },
			},
		},
		medical: {
			name: "Medical", status: "nominal", crew_min: 300, crew_assigned: 330,
			subsectors: {
				triage_care:         { name: "Triage & Care",       crew: 180, status: "nominal" },
				biomedical_research: { name: "Biomedical Research", crew: 150, status: "nominal" },
			},
		},
	},

	active_sector: "travel",
	event_log: [],

	new_game(name) {
		this.guildmaster_name = name || "UNKNOWN";
		this.cycle = 1;
		this.game_active = true;
		this.resources.credits.value = 50000;
		this.resources.fuel.value = 8000;
		this.resources.food.value = 12000;
		this.resources.munitions.value = 3000;
		this.resources.parts.value = 2500;
		this.resources.medicine.value = 1500;
		this.crew_total = 10000;
		this.morale = 0.7;
		this.threat_level = 0.3;
		this.station_hull = 1.0;
		this.hull_integrity = 1.0;
		this.gm_alive = true;
		this.gm_health = 1.0;
		this.gm_political_heat = 0.0;
		this.gm_personal_threat = 0.0;
		this.gm_imprisoned = false;
		this.event_log = [];
		this.active_sector = "travel";
		SectorEventManager.reset();
		this.log_event("CYCLE", `Guildmaster ${this.guildmaster_name} assumes command.`, "info");
	},

	advance_cycle() {
		if (!this.game_active) return;
		this.cycle++;
		for (const key in this.resources) {
			const r = this.resources[key];
			r.value = Math.max(0, r.value + r.delta);
		}
		SectorEventManager.tick();
		this.log_event("CYCLE", `Cycle ${this.cycle} begins.`, "info");
		this._check_loss();
	},

	_check_loss() {
		if (this.station_hull <= 0)
			return this._game_over("Station hull failure. Decompression complete.", "combat");
		if (this.hull_integrity <= 0)
			return this._game_over("Structural integrity collapse. Station broken in two.", "combat");
		if (this.resources.food.value <= 0)
			return this._game_over("Mass starvation. The crew turned on each other before they turned on you.", "combat");
		if (this.resources.fuel.value <= 0)
			return this._game_over("Fuel depleted. Life support offline. Cold and dark.", "combat");
		if (this.crew_total < 2000)
			return this._game_over("Crew below operational minimum. Station nonfunctional.", "combat");
		if (this.morale <= 0.05)
			return this._game_over("Mass mutiny. The crew dragged you out of your quarters.", "combat");
		if (!this.gm_alive)
			return this._game_over("The Guildmaster is dead.", "gm");
		if (this.gm_imprisoned)
			return this._game_over("You have been imprisoned by Guild Central.", "gm");
		if (this.gm_political_heat >= 1.0)
			return this._game_over("Political heat reached terminal levels.", "gm");
		if (this.gm_personal_threat >= 1.0)
			return this._game_over("They came for you in the night. Successfully.", "gm");
	},

	_game_over(reason, category) {
		this.game_active = false;
		show_game_over(reason, category);
	},

	log_event(category, message, severity) {
		this.event_log.unshift({
			cycle: this.cycle,
			category: category,
			message: message,
			severity: severity || "info",
		});
		if (this.event_log.length > 50) this.event_log.pop();
	},

	get_resource(key) { return this.resources[key].value; },
	modify_resource(key, amount) {
		const r = this.resources[key];
		r.value = Math.max(0, r.value + amount);
	},

	apply_effects(effects) {
		for (const key in effects) {
			const val = effects[key];
			if (this.resources[key]) {
				this.modify_resource(key, val);
			} else if (key === "crew_total") {
				this.crew_total = Math.max(0, this.crew_total + val);
			} else if (key === "morale") {
				this.morale = Math.max(0, Math.min(1, this.morale + val));
			} else if (key === "threat_level") {
				this.threat_level = Math.max(0, Math.min(1, this.threat_level + val));
			} else if (key === "station_hull") {
				this.station_hull = Math.max(0, Math.min(1, this.station_hull + val));
			} else if (key === "hull_integrity") {
				this.hull_integrity = Math.max(0, Math.min(1, this.hull_integrity + val));
			} else if (key === "gm_political_heat") {
				this.gm_political_heat = Math.max(0, Math.min(1, this.gm_political_heat + val));
			} else if (key === "gm_personal_threat") {
				this.gm_personal_threat = Math.max(0, Math.min(1, this.gm_personal_threat + val));
			}
		}
	},

	get_resource_pct(key) {
		const r = this.resources[key];
		return r.value / r.max;
	},

	get_morale_label() {
		if (this.morale > 0.7) return "NOMINAL";
		if (this.morale > 0.4) return "STRAINED";
		if (this.morale > 0.2) return "POOR";
		return "CRITICAL";
	},

	get_threat_label() {
		if (this.threat_level < 0.3) return "LOW";
		if (this.threat_level < 0.6) return "ELEVATED";
		if (this.threat_level < 0.85) return "HIGH";
		return "CRITICAL";
	},
};

// ============================================================
// SECTOR EVENT MANAGER
// ============================================================
const COOLDOWN_SHORT  = 3;
const COOLDOWN_MEDIUM = 5;
const COOLDOWN_LONG   = 8;

const SectorEventManager = {
	cooldowns: {},

	EVENTS: {
		boost_tourism: {
			id: "boost_tourism", sector: "travel",
			name: "BOOST TOURISM",
			desc: "Expand tourism capacity. +6,000 CR immediate.",
			flavor: "Fresh credits. Fresh faces. Fresh problems.",
			cost: { credits: -2000 },
			cooldown: COOLDOWN_MEDIUM,
			effects: { credits: 4000 },
			result: "Tourism expanded. Credits flowing in.",
		},
		short_range_contracts: {
			id: "short_range_contracts", sector: "travel",
			name: "SHORT RANGE CONTRACTS",
			desc: "Post local courier contracts. +6,000 CR.",
			flavor: "Dangerous work. Decent pay. No questions asked.",
			cost: {},
			cooldown: COOLDOWN_SHORT,
			effects: { credits: 6000 },
			result: "Courier contracts posted. Credits incoming.",
		},
		emergency_recall: {
			id: "emergency_recall", sector: "travel",
			name: "EMERGENCY RECALL",
			desc: "Cancel outbound travel. Reduces threat.",
			flavor: "Nobody leaves until we know what is out there.",
			cost: {},
			cooldown: COOLDOWN_LONG,
			effects: { threat_level: -0.05, morale: -0.03 },
			result: "Outbound travel cancelled.",
		},
		buy_fuel_bulk: {
			id: "buy_fuel_bulk", sector: "trade_logistics",
			name: "BUY FUEL BULK",
			desc: "Purchase 2,000 fuel cells.",
			flavor: "The station breathes fuel. Never let it run dry.",
			cost: { credits: -12000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -12000, fuel: 2000 },
			result: "2,000 fuel cells acquired.",
		},
		implement_rationing: {
			id: "implement_rationing", sector: "trade_logistics",
			name: "IMPLEMENT RATIONING",
			desc: "Reduce food consumption. Morale hit.",
			flavor: "They will grumble. They will comply.",
			cost: {},
			cooldown: COOLDOWN_MEDIUM,
			effects: { morale: -0.06 },
			result: "Rationing implemented. Crew unhappy but fed.",
		},
		supply_chain_audit: {
			id: "supply_chain_audit", sector: "trade_logistics",
			name: "SUPPLY CHAIN AUDIT",
			desc: "Find inefficiencies. +8,000 CR recovered.",
			flavor: "Someone is always skimming. Always.",
			cost: {},
			cooldown: COOLDOWN_LONG,
			effects: { credits: 8000 },
			result: "Audit complete. Recovered embezzled credits.",
		},
		deploy_sensor_buoys: {
			id: "deploy_sensor_buoys", sector: "exploration",
			name: "DEPLOY SENSOR BUOYS",
			desc: "Expand defensive coverage. Reduces threat.",
			flavor: "You cannot fight what you cannot see.",
			cost: { credits: -8000 },
			cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -8000, threat_level: -0.06 },
			result: "Sensor buoys deployed.",
		},
		expedition_contract: {
			id: "expedition_contract", sector: "exploration",
			name: "POST EXPEDITION CONTRACT",
			desc: "Advertise paid expedition. +10,400 CR.",
			flavor: "Let someone else take the risk. Charge them for the privilege.",
			cost: { credits: -2000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: 10400 },
			result: "Expedition contract posted.",
		},
		lockdown_protocol: {
			id: "lockdown_protocol", sector: "security_intel",
			name: "LOCKDOWN PROTOCOL",
			desc: "Reduces threat, hurts morale.",
			flavor: "Order restored. Freedom suspended.",
			cost: { credits: -6000 },
			cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -6000, threat_level: -0.08, morale: -0.04 },
			result: "Lockdown executed.",
		},
		restock_armoury: {
			id: "restock_armoury", sector: "security_intel",
			name: "RESTOCK ARMOURY",
			desc: "Purchase 1,000 munitions.",
			flavor: "An empty armoury is an invitation.",
			cost: { credits: -8000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -8000, munitions: 1000 },
			result: "Armoury restocked.",
		},
		purge_agents: {
			id: "purge_agents", sector: "security_intel",
			name: "PURGE SUSPECTED AGENTS",
			desc: "Risk of innocent casualties.",
			flavor: "Better a hundred wrongful arrests than one assassination.",
			cost: {},
			cooldown: COOLDOWN_LONG,
			effects: { threat_level: -0.1, morale: -0.1, gm_political_heat: 0.1 },
			result: "Purge conducted. Crew shaken.",
		},
		dispatch_envoy: {
			id: "dispatch_envoy", sector: "politics_info",
			name: "DISPATCH ENVOY",
			desc: "Improve faction relations.",
			flavor: "Diplomacy is just war with paperwork.",
			cost: { credits: -5000 },
			cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -5000, gm_political_heat: -0.05 },
			result: "Envoy dispatched.",
		},
		broadcast_propaganda: {
			id: "broadcast_propaganda", sector: "politics_info",
			name: "BROADCAST PROPAGANDA",
			desc: "Boost station morale.",
			flavor: "The truth is whatever the broadcast says it is.",
			cost: { credits: -3000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -3000, morale: 0.06 },
			result: "Propaganda broadcast.",
		},
		narrative_control: {
			id: "narrative_control", sector: "politics_info",
			name: "NARRATIVE CONTROL",
			desc: "Suppress damaging information.",
			flavor: "What they do not know cannot hurt you.",
			cost: { credits: -8000 },
			cooldown: COOLDOWN_LONG,
			effects: { credits: -8000, gm_political_heat: -0.12 },
			result: "Narrative suppressed.",
		},
		negotiate_unions: {
			id: "negotiate_unions", sector: "labor_affairs",
			name: "NEGOTIATE WITH UNIONS",
			desc: "Resolve grievances. +5% morale.",
			flavor: "They want to be heard. Sometimes that is enough.",
			cost: { credits: -8000 },
			cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -8000, morale: 0.05 },
			result: "Negotiations successful.",
		},
		grant_rations: {
			id: "grant_rations", sector: "labor_affairs",
			name: "GRANT RATION INCREASE",
			desc: "Improve morale. Costs food.",
			flavor: "Full bellies make for quieter corridors.",
			cost: {},
			cooldown: COOLDOWN_MEDIUM,
			effects: { food: -3000, morale: 0.08 },
			result: "Ration increase granted.",
		},
		mandatory_overtime: {
			id: "mandatory_overtime", sector: "labor_affairs",
			name: "MANDATORY OVERTIME",
			desc: "Boost credits. Morale takes a hard hit.",
			flavor: "Rest is a luxury. Survival is not.",
			cost: {},
			cooldown: COOLDOWN_LONG,
			effects: { credits: 8000, morale: -0.12 },
			result: "Overtime enforced.",
		},
		emergency_repairs: {
			id: "emergency_repairs", sector: "engineering",
			name: "EMERGENCY HULL REPAIRS",
			desc: "Restore hull integrity +10%.",
			flavor: "Patch it. Pray it holds.",
			cost: { credits: -5000, parts: -300 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -5000, parts: -300, hull_integrity: 0.1 },
			result: "Hull integrity restored.",
		},
		fabrication_run: {
			id: "fabrication_run", sector: "engineering",
			name: "FABRICATION RUN",
			desc: "Produce 400 parts.",
			flavor: "Everything breaks eventually.",
			cost: { credits: -6000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -6000, parts: 400 },
			result: "400 parts produced.",
		},
		power_grid_upgrade: {
			id: "power_grid_upgrade", sector: "engineering",
			name: "UPGRADE POWER GRID",
			desc: "Improve power efficiency.",
			flavor: "Efficiency is survival measured in kilowatts.",
			cost: { credits: -15000 },
			cooldown: COOLDOWN_LONG,
			effects: { credits: -15000, hull_integrity: 0.05 },
			result: "Power grid upgraded.",
		},
		restock_medical: {
			id: "restock_medical", sector: "medical",
			name: "RESTOCK MEDICAL",
			desc: "Purchase 800 medicine.",
			flavor: "You cannot treat the dead.",
			cost: { credits: -6000 },
			cooldown: COOLDOWN_SHORT,
			effects: { credits: -6000, medicine: 800 },
			result: "Medical supplies restocked.",
		},
		mass_inoculation: {
			id: "mass_inoculation", sector: "medical",
			name: "MASS INOCULATION",
			desc: "Reduce outbreak risk.",
			flavor: "Prevention is cheap. Outbreaks are not.",
			cost: { credits: -10000, medicine: -400 },
			cooldown: COOLDOWN_LONG,
			effects: { credits: -10000, medicine: -400, morale: 0.02, threat_level: -0.02 },
			result: "Mass inoculation complete.",
		},
		quarantine_block: {
			id: "quarantine_block", sector: "medical",
			name: "QUARANTINE BLOCK",
			desc: "Prevents spread. Crew unhappy.",
			flavor: "The locked door is the kindest thing.",
			cost: {},
			cooldown: COOLDOWN_MEDIUM,
			effects: { morale: -0.06, threat_level: -0.03 },
			result: "Block quarantined.",
		},
	},

	tick() {
		for (const id in this.cooldowns) {
			this.cooldowns[id]--;
			if (this.cooldowns[id] <= 0) delete this.cooldowns[id];
		}
	},

	get_events_for_sector(sector_key) {
		return Object.values(this.EVENTS).filter(e => e.sector === sector_key);
	},

	is_on_cooldown(event_id) {
		return this.cooldowns[event_id] !== undefined;
	},

	get_cooldown(event_id) {
		return this.cooldowns[event_id] || 0;
	},

	can_afford(event_id) {
		const ev = this.EVENTS[event_id];
		if (!ev) return false;
		for (const key in ev.cost) {
			if (ev.cost[key] < 0) {
				if (GameState.get_resource(key) < Math.abs(ev.cost[key])) return false;
			}
		}
		return true;
	},

	execute(event_id) {
		const ev = this.EVENTS[event_id];
		if (!ev) return;
		if (!this.can_afford(event_id)) {
			GameState.log_event("EVENT", `Cannot execute — insufficient resources.`, "warning");
			return;
		}
		GameState.apply_effects(ev.effects);
		GameState.log_event(ev.sector.toUpperCase(), ev.result, "info");
		this.cooldowns[event_id] = ev.cooldown;
	},

	reset() {
		this.cooldowns = {};
	},
};

// ============================================================
// UI REFRESH
// ============================================================
function refresh_header() {
	document.getElementById("station-name").textContent =
		`STATION ${GameState.station_name} // COMMAND DECK`;
	document.getElementById("cycle-display").textContent =
		`CYCLE ${String(GameState.cycle).padStart(3, "0")}`;
	document.getElementById("gm-name").textContent =
		`GUILDMASTER: ${GameState.guildmaster_name}`;

	const status = document.getElementById("status-line");
	status.textContent = `MORALE: ${GameState.get_morale_label()} // THREAT: ${GameState.get_threat_label()}`;
	status.className = "";
	if (GameState.morale < 0.4 || GameState.threat_level > 0.6) status.classList.add("warning");
	if (GameState.morale < 0.2 || GameState.threat_level > 0.85) status.classList.add("critical");
}

function refresh_resources() {
	const bar = document.getElementById("resource-bar");
	let html = "";

	const crew_pct = GameState.crew_total / 15000;
	let crew_class = "resource-card";
	if (crew_pct < 0.3) crew_class += " critical";
	else if (crew_pct < 0.5) crew_class += " low";
	html += `<div class="${crew_class}"><div class="resource-label">CREW</div><div class="resource-value">${GameState.crew_total.toLocaleString()}</div></div>`;

	for (const key in GameState.resources) {
		const r = GameState.resources[key];
		const pct = GameState.get_resource_pct(key);
		let cls = "resource-card";
		if (pct < 0.2) cls += " critical";
		else if (pct < 0.4) cls += " low";
		const delta_sign = r.delta > 0 ? "+" : "";
		html += `<div class="${cls}"><div class="resource-label">${r.label}</div><div class="resource-value">${r.value.toLocaleString()}</div><div class="resource-delta">${delta_sign}${r.delta}</div></div>`;
	}
	bar.innerHTML = html;
}

function refresh_log() {
	const log_div = document.getElementById("cycle-log");
	let html = "<h3>CYCLE LOG</h3>";
	if (GameState.event_log.length === 0) {
		html += '<p style="font-size:11px; color:var(--text-mid);">Awaiting events...</p>';
	} else {
		for (const entry of GameState.event_log.slice(0, 15)) {
			const sev = entry.severity || "info";
			html += `<p class="log-entry ${sev}">C${String(entry.cycle).padStart(3,"0")} [${entry.category}] ${entry.message}</p>`;
		}
	}
	log_div.innerHTML = html;
}

function refresh_content() {
	const content = document.getElementById("content");
	const sector = GameState.sectors[GameState.active_sector];

	let html = `<h2>${sector.name.toUpperCase()}</h2>`;
	html += `<p style="color: var(--text-mid); font-size:12px;">STATUS: ${sector.status.toUpperCase()} // CREW: ${sector.crew_assigned} / ${sector.crew_min}</p>`;

	html += `<div class="section-title">SUBSECTORS</div>`;
	for (const sub_key in sector.subsectors) {
		const sub = sector.subsectors[sub_key];
		html += `<div class="subsector-row"><span class="subsector-name">${sub.name}</span><span class="subsector-crew">${sub.crew} crew</span><span class="subsector-status ${sub.status}">${sub.status.toUpperCase()}</span></div>`;
	}

	html += `<div class="section-title">SECTOR EVENTS</div>`;
	const events = SectorEventManager.get_events_for_sector(GameState.active_sector);
	if (events.length === 0) {
		html += `<p style="color: var(--text-mid); font-size:12px;">No events available.</p>`;
	} else {
		for (const ev of events) {
			const on_cooldown = SectorEventManager.is_on_cooldown(ev.id);
			const affordable = SectorEventManager.can_afford(ev.id);
			let cls = "event-btn";
			let label = ev.name;
			let disabled = "";

			if (on_cooldown) {
				const cd = SectorEventManager.get_cooldown(ev.id);
				cls += " cooldown";
				label = `${ev.name} [COOLDOWN: ${cd}c]`;
				disabled = "disabled";
			} else if (!affordable) {
				cls += " unaffordable";
				label = `${ev.name} [INSUFFICIENT]`;
				disabled = "disabled";
			}

			html += `<button class="${cls}" data-event="${ev.id}" ${disabled}>
				<div class="event-name">${label}</div>
				<div class="event-desc">${ev.desc}</div>
				<div class="event-flavor">${ev.flavor}</div>
			</button>`;
		}
	}

	content.innerHTML = html;

	// Wire up event buttons
	content.querySelectorAll(".event-btn").forEach(btn => {
		if (btn.disabled) return;
		btn.addEventListener("click", () => on_sector_event(btn.dataset.event));
	});
}

function refresh_sector_nav() {
	document.querySelectorAll(".sector-btn").forEach(btn => {
		btn.classList.toggle("active", btn.dataset.sector === GameState.active_sector);
	});
}

function refresh_advance_btn() {
	const btn = document.getElementById("advance-btn");
	const warnings = [];
	if (GameState.morale < 0.2) warnings.push("MORALE CRIT");
	if (GameState.station_hull < 0.2) warnings.push("HULL CRIT");
	if (GameState.get_resource_pct("food") < 0.15) warnings.push("FOOD LOW");
	if (GameState.get_resource_pct("fuel") < 0.15) warnings.push("FUEL LOW");

	if (warnings.length > 0) {
		btn.textContent = `ADVANCE [!] ${warnings.join(" // ")}`;
		btn.classList.add("warning");
	} else {
		btn.textContent = "ADVANCE CYCLE";
		btn.classList.remove("warning");
	}
}

function refresh_all() {
	refresh_header();
	refresh_resources();
	refresh_log();
	refresh_content();
	refresh_sector_nav();
	refresh_advance_btn();
}

// ============================================================
// GAME OVER
// ============================================================
const EPITAPHS = {
	combat: [
		"The station did not mourn. Stations never do.",
		"Hull integrity: zero. Legacy: disputed.",
		"The void is patient. You were not.",
		"Structural failure is just physics. This was preventable.",
	],
	gm: [
		"No successor was named. That was intentional.",
		"The Guild scrubbed your name from the records. Again.",
		"Power is borrowed. Someone called in the debt.",
		"You saw it coming. Everyone did.",
	],
};

function show_game_over(reason, category) {
	const screen = document.getElementById("game-over-screen");
	const epitaphs = EPITAPHS[category] || EPITAPHS.combat;
	const epitaph = epitaphs[Math.floor(Math.random() * epitaphs.length)];

	let category_text = "// STATION LOST //";
	if (category === "combat") category_text = "// COMBAT LOSS //";
	if (category === "gm") category_text = "// COMMAND TERMINATED //";

	document.getElementById("game-over-category").textContent = category_text;
	document.getElementById("game-over-title").textContent =
		`GUILDMASTER ${GameState.guildmaster_name} — DECEASED`;
	document.getElementById("game-over-reason").textContent = reason;
	document.getElementById("game-over-epitaph").textContent = `"${epitaph}"`;

	const stats = document.getElementById("game-over-stats");
	stats.innerHTML = `
		<div class="stat-item"><div class="stat-label">CYCLES SERVED</div><div class="stat-value">${GameState.cycle}</div></div>
		<div class="stat-item"><div class="stat-label">FINAL CREW</div><div class="stat-value">${GameState.crew_total.toLocaleString()}</div></div>
	`;

	document.getElementById("app").style.display = "none";
	screen.style.display = "flex";
}

// ============================================================
// EVENT HANDLERS
// ============================================================
function on_advance() {
	GameState.advance_cycle();
	if (GameState.game_active) refresh_all();
}

function on_sector_click(sector_key) {
	GameState.active_sector = sector_key;
	refresh_all();
}

function on_sector_event(event_id) {
	SectorEventManager.execute(event_id);
	refresh_all();
}

function on_start() {
	const name = document.getElementById("gm-name-input").value.trim() || "UNKNOWN";
	GameState.new_game(name.toUpperCase());
	document.getElementById("welcome-screen").style.display = "none";
	document.getElementById("app").style.display = "grid";
	refresh_all();
}

function on_restart() { location.reload(); }

// ============================================================
// INIT
// ============================================================
function init() {
	console.log("Guildmaster booting...");

	document.getElementById("start-btn").addEventListener("click", on_start);
	document.getElementById("restart-btn").addEventListener("click", on_restart);
	document.getElementById("advance-btn").addEventListener("click", on_advance);

	document.querySelectorAll(".sector-btn").forEach(btn => {
		btn.addEventListener("click", () => on_sector_click(btn.dataset.sector));
	});
}

init();
