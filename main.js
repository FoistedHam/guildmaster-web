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

	black_market_unlocked: false,
	tourism_crew: 0,
	rationing_cycles: 0,
	active_sector: "travel",
	event_log: [],

	new_game(name) {
		this.guildmaster_name = name || "UNKNOWN";
		this.cycle = 1;
		this.game_active = true;
		this.resources.credits.value = 50000;
		this.resources.fuel.value = 8000;
		this.resources.fuel.delta = -50;
		this.resources.food.value = 12000;
		this.resources.food.delta = -100;
		this.resources.munitions.value = 3000;
		this.resources.parts.value = 2500;
		this.resources.medicine.value = 1500;
		this.resources.medicine.delta = -10;
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
		this.black_market_unlocked = false;
		this.tourism_crew = 0;
		this.rationing_cycles = 0;
		this.event_log = [];
		this.active_sector = "travel";
		SectorEventManager.reset();
		ThreatManager.reset();
		PerilManager.reset();
		EconomyManager.reset();
		BlackMarketManager.reset();
		WorkforceManager.reset();
		this.log_event("CYCLE", `Guildmaster ${this.guildmaster_name} assumes command.`, "info");
	},

	advance_cycle() {
		if (!this.game_active) return;
		this.cycle++;
		// Track crew before deltas/ticks
		const crew_before = this.crew_total;
		// Apply rationing if active (reduces food consumption that cycle)
		const food_delta_original = this.resources.food.delta;
		if (this.rationing_cycles > 0) {
			this.resources.food.delta = Math.floor(this.resources.food.delta * 0.5);
			this.rationing_cycles--;
		}
		for (const key in this.resources) {
			const r = this.resources[key];
			r.value = Math.max(0, r.value + r.delta);
		}
		// Restore food delta after rationing applied
		this.resources.food.delta = food_delta_original;
		EconomyManager.tick(this.cycle);
		BlackMarketManager.tick();
		WorkforceManager.tick();
		SectorEventManager.tick();
		ThreatManager.tick();
		PerilManager.tick(this.cycle);
		// Adjust food delta if tourism crew died
		if (this.tourism_crew > 0 && this.crew_total < crew_before) {
			const crew_lost = crew_before - this.crew_total;
			const tourism_lost = Math.min(this.tourism_crew, crew_lost);
			if (tourism_lost > 0) {
				this.tourism_crew -= tourism_lost;
				this.resources.food.delta = Math.min(0, this.resources.food.delta + (tourism_lost * 5));
			}
		}
		this.log_event("CYCLE", `Cycle ${this.cycle} begins.`, "info");
		this._check_loss();
	},

	_check_loss() {
		if (this.station_hull <= 0)
			return this._game_over("Station hull failure. Decompression complete.", "combat");
		if (this.hull_integrity <= 0)
			return this._game_over("Structural integrity collapse.", "combat");
		if (this.resources.food.value <= 0)
			return this._game_over("Mass starvation.", "combat");
		if (this.resources.fuel.value <= 0)
			return this._game_over("Fuel depleted. Life support offline.", "combat");
		if (this.crew_total < 2000)
			return this._game_over("Crew below operational minimum.", "combat");
		if (this.morale <= 0.05)
			return this._game_over("Mass mutiny.", "combat");
		if (!this.gm_alive)
			return this._game_over("The Guildmaster is dead.", "gm");
		if (this.gm_imprisoned)
			return this._game_over("Imprisoned by Guild Central.", "gm");
		if (this.gm_political_heat >= 1.0)
			return this._game_over("Political heat reached terminal levels.", "gm");
		if (this.gm_personal_threat >= 1.0)
			return this._game_over("They came for you in the night.", "gm");
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
			if (this.resources[key]) this.modify_resource(key, val);
			else if (key === "crew_total") this.crew_total = Math.max(0, this.crew_total + val);
			else if (key === "morale") this.morale = Math.max(0, Math.min(1, this.morale + val));
			else if (key === "threat_level") this.threat_level = Math.max(0, Math.min(1, this.threat_level + val));
			else if (key === "station_hull") this.station_hull = Math.max(0, Math.min(1, this.station_hull + val));
			else if (key === "hull_integrity") this.hull_integrity = Math.max(0, Math.min(1, this.hull_integrity + val));
			else if (key === "gm_political_heat") this.gm_political_heat = Math.max(0, Math.min(1, this.gm_political_heat + val));
			else if (key === "gm_personal_threat") this.gm_personal_threat = Math.max(0, Math.min(1, this.gm_personal_threat + val));
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
// WORKFORCE MANAGER
// ============================================================
const WorkforceManager = {
	specialists: {},
	used_names: [],

	RANK_SPECIALIST: 0,
	RANK_SENIOR: 1,
	RANK_CHIEF: 2,

	RANK_NAMES: { 0: "SPECIALIST", 1: "SENIOR SPECIALIST", 2: "SECTOR CHIEF" },
	RANK_CLASS: { 0: "specialist", 1: "senior", 2: "chief" },

	XP_TO_SENIOR: 100,
	XP_TO_CHIEF: 300,

	XP_PER_CYCLE_BASE: 2,
	XP_ON_EVENT_USE: 8,
	XP_ON_PERIL_USE: 15,

	COST_TO_SPECIALIST: 2000,
	COST_TO_SENIOR: 15000,
	COST_TO_CHIEF: 40000,

	LABOR_DISCOUNT: { 0: 0.10, 1: 0.15, 2: 0.25 },

	NAME_POOL: ["VOSS", "CHEN", "REYES", "OKAFOR", "HALVORSEN", "PETROV", "NAKAMURA", "SINGH",
				"MBEKI", "DRAGOMIR", "FERRARA", "KOWALSKI", "ASHFORD", "YILMAZ", "BRENNAN",
				"SATO", "ODUYA", "LINDQVIST", "HASSAN", "MARCHETTI"],

	tick() {
		const xp_mult = 1.0 + (GameState.threat_level * 2.0);
		for (const sector_key in this.specialists) {
			const s = this.specialists[sector_key];
			if (!s.alive) continue;
			if (s.injured_cycles > 0) {
				s.injured_cycles--;
				if (s.injured_cycles === 0) {
					GameState.log_event("WORKFORCE", `${s.name} recovered.`, "info");
				}
				continue;
			}
			const xp_gain = Math.floor(this.XP_PER_CYCLE_BASE * xp_mult);
			this._add_xp(sector_key, xp_gain);
			this._apply_buff(sector_key);
		}
	},

	_apply_buff(sector_key) {
		const s = this.specialists[sector_key];
		if (!s.alive || s.injured_cycles > 0) return;
		const buffs = {
			0: { morale: 0.005, threat_level: -0.005 },
			1: { morale: 0.010, threat_level: -0.010 },
			2: { morale: 0.015, threat_level: -0.015 },
		};
		GameState.apply_effects(buffs[s.rank]);
	},

	_add_xp(sector_key, amount) {
		const s = this.specialists[sector_key];
		if (!s || !s.alive || s.injured_cycles > 0) return;
		s.xp += amount;
	},

	get_promotion_cost(sector_key) {
		let base = this.COST_TO_SPECIALIST;
		if (this.specialists[sector_key]) {
			const s = this.specialists[sector_key];
			if (s.rank === this.RANK_SPECIALIST) base = this.COST_TO_SENIOR;
			else if (s.rank === this.RANK_SENIOR) base = this.COST_TO_CHIEF;
			else return 0;
		}
		let discount = 0;
		if (this.has_active_specialist("labor_affairs")) {
			const labor_rank = this.specialists["labor_affairs"].rank;
			discount = this.LABOR_DISCOUNT[labor_rank];
		}
		return Math.floor(base * (1 - discount));
	},

	can_promote(sector_key) {
		if (this.specialists[sector_key]) {
			const s = this.specialists[sector_key];
			if (!s.alive) return false;
			if (s.injured_cycles > 0) return false;
			if (s.rank === this.RANK_CHIEF) return false;
		}
		if (GameState.crew_total < 100) return false;
		const cost = this.get_promotion_cost(sector_key);
		if (GameState.get_resource("credits") < cost) return false;
		return true;
	},

	promote(sector_key) {
		if (!this.can_promote(sector_key)) return false;
		const cost = this.get_promotion_cost(sector_key);
		GameState.modify_resource("credits", -cost);

		if (this.specialists[sector_key]) {
			const s = this.specialists[sector_key];
			s.rank++;
			GameState.log_event("WORKFORCE", `${s.name} promoted to ${this.RANK_NAMES[s.rank]}. Cost: ${cost} CR.`, "info");
			return true;
		}

		const name = this._generate_name();
		this.specialists[sector_key] = {
			name: name,
			sector: sector_key,
			rank: this.RANK_SPECIALIST,
			xp: 0,
			injured_cycles: 0,
			alive: true,
			missions: 0,
			perils: 0,
		};
		GameState.crew_total -= 1;
		GameState.log_event("WORKFORCE", `${name} promoted to Specialist. Cost: ${cost} CR.`, "info");
		return true;
	},

	_generate_name() {
		const available = this.NAME_POOL.filter(n => !this.used_names.includes(n));
		if (available.length === 0) return `OPERATIVE-${Math.floor(Math.random() * 999)}`;
		const chosen = available[Math.floor(Math.random() * available.length)];
		this.used_names.push(chosen);
		return chosen;
	},

	has_active_specialist(sector_key) {
		const s = this.specialists[sector_key];
		return s && s.alive && s.injured_cycles === 0;
	},

	get_xp_progress(sector_key) {
		const s = this.specialists[sector_key];
		if (!s) return null;
		let next = this.XP_TO_SENIOR;
		if (s.rank === this.RANK_SENIOR) next = this.XP_TO_CHIEF;
		else if (s.rank === this.RANK_CHIEF) next = this.XP_TO_CHIEF;
		return { xp: s.xp, next: next, rank: s.rank };
	},

	on_event_used(sector_key) {
		if (this.has_active_specialist(sector_key)) {
			this._add_xp(sector_key, this.XP_ON_EVENT_USE);
			this.specialists[sector_key].missions++;
		}
	},

	reset() {
		this.specialists = {};
		this.used_names = [];
	},
};

// ============================================================
// ECONOMY MANAGER
// ============================================================
const EconomyManager = {
	BASE_PRICES: { fuel: 8, food: 1, munitions: 12, parts: 10, medicine: 20 },
	prices: { fuel: 8, food: 1, munitions: 12, parts: 10, medicine: 20 },
	price_trend: { fuel: "steady", food: "steady", munitions: "steady", parts: "steady", medicine: "steady" },
	import_offers: [],
	delivery_queue: [],
	export_offers: [],
	offer_refresh_countdown: 3,
	trade_vessel: null,
	vessel_countdown: 8,

	VESSEL_ITEMS: [
		{ name: "Bootleg Fuel Cells", desc: "Sketchy supplier offers cheap fuel.", flavor: "Smells off. Probably fine.",
		  cost: 6000, success_chance: 0.75, success: { fuel: 1500 }, fail: { credits: -2000 } },
		{ name: "Refurbished Med-Stims", desc: "Recovered from a derelict med ship.", flavor: "Expiry date scratched off.",
		  cost: 8000, success_chance: 0.7, success: { medicine: 600 }, fail: { medicine: 200, morale: -0.03 } },
		{ name: "Salvaged Hull Plating", desc: "Old plating from a decommissioned hauler.", flavor: "Some of these have weld marks.",
		  cost: 10000, success_chance: 0.8, success: { parts: 800 }, fail: { parts: 300 } },
		{ name: "Mystery Cargo", desc: "Sealed container. Seller will not open.", flavor: "What could go wrong.",
		  cost: 5000, success_chance: 0.5, success: { credits: 12000 }, fail: { morale: -0.05 } },
	],

	tick(cycle) {
		this._update_prices();
		this.offer_refresh_countdown--;
		if (this.offer_refresh_countdown <= 0) {
			this._refresh_offers();
			this.offer_refresh_countdown = 3;
		}
		this._tick_deliveries();
		this.vessel_countdown--;
		if (this.trade_vessel) {
			this.trade_vessel.cycles_docked--;
			if (this.trade_vessel.cycles_docked <= 0) {
				GameState.log_event("TRADE", `Vessel ${this.trade_vessel.name} departed.`, "info");
				this.trade_vessel = null;
				this.vessel_countdown = 6 + Math.floor(Math.random() * 6);
			}
		} else if (this.vessel_countdown <= 0) {
			this._spawn_vessel();
		}
	},

	_update_prices() {
		for (const key in this.BASE_PRICES) {
			const old_price = this.prices[key];
			const fluctuation = (Math.random() - 0.5) * 0.3;
			const new_price = Math.max(1, Math.floor(this.BASE_PRICES[key] * (1 + fluctuation)));
			if (new_price > old_price) this.price_trend[key] = "rising";
			else if (new_price < old_price) this.price_trend[key] = "falling";
			else this.price_trend[key] = "steady";
			this.prices[key] = new_price;
		}
	},

	_refresh_offers() {
		this.import_offers = [];
		const resource_types = ["fuel", "food", "munitions", "parts", "medicine"];
		for (let i = 0; i < 3; i++) {
			const res = resource_types[Math.floor(Math.random() * resource_types.length)];
			const amount = 500 + Math.floor(Math.random() * 1500);
			const bulk = amount > 1500;
			let cost = amount * this.prices[res];
			if (bulk) cost = Math.floor(cost * 0.85);
			const delivery = 3 + Math.floor(Math.random() * 6);
			this.import_offers.push({
				resource: res, amount: amount, total_cost: cost,
				delivery_cycles: delivery, bulk_discount: bulk,
			});
		}
		this.export_offers = [];
		for (const key in this.BASE_PRICES) {
			const stock = GameState.get_resource(key);
			if (stock < 500) continue;
			const max_amount = Math.floor(stock * 0.4);
			const markup = 1.1 + Math.random() * 0.25;
			const price_per_unit = Math.floor(this.prices[key] * markup);
			this.export_offers.push({
				resource: key, max_amount: max_amount, price_per_unit: price_per_unit,
			});
		}
	},

	_tick_deliveries() {
		for (let i = this.delivery_queue.length - 1; i >= 0; i--) {
			const order = this.delivery_queue[i];
			order.cycles_remaining--;
			if (order.cycles_remaining <= 0) {
				GameState.modify_resource(order.resource, order.amount);
				GameState.log_event("TRADE", `Delivery: ${order.amount} ${order.resource}.`, "info");
				this.delivery_queue.splice(i, 1);
			}
		}
	},

	_spawn_vessel() {
		const stock = [];
		const pool = [...this.VESSEL_ITEMS];
		for (let i = 0; i < 4 && pool.length > 0; i++) {
			const idx = Math.floor(Math.random() * pool.length);
			stock.push(pool.splice(idx, 1)[0]);
		}
		this.trade_vessel = {
			name: ["BLACKWATER", "GHOST FREIGHTER", "OUTRIDER-7", "VAGRANT MAJESTY"][Math.floor(Math.random() * 4)],
			stock: stock,
			cycles_docked: 1,
		};
		GameState.log_event("TRADE", `Trade vessel ${this.trade_vessel.name} docked.`, "info");
	},

	purchase_import(offer_index) {
		const offer = this.import_offers[offer_index];
		if (!offer) return;
		if (GameState.get_resource("credits") < offer.total_cost) {
			GameState.log_event("TRADE", "Insufficient credits.", "warning");
			return;
		}
		GameState.modify_resource("credits", -offer.total_cost);
		this.delivery_queue.push({
			resource: offer.resource, amount: offer.amount, cycles_remaining: offer.delivery_cycles,
		});
		this.import_offers.splice(offer_index, 1);
		GameState.log_event("TRADE", `Ordered ${offer.amount} ${offer.resource}. ETA: ${offer.delivery_cycles} cycles.`, "info");
	},

	sell_export(resource_key, amount) {
		if (GameState.get_resource(resource_key) < amount) return;
		const offer = this.export_offers.find(o => o.resource === resource_key);
		if (!offer) return;
		const total = amount * offer.price_per_unit;
		GameState.modify_resource(resource_key, -amount);
		GameState.modify_resource("credits", total);
		GameState.log_event("TRADE", `Sold ${amount} ${resource_key} for ${total} CR.`, "info");
	},

	purchase_vessel_item(item_index) {
		if (!this.trade_vessel) return;
		const item = this.trade_vessel.stock[item_index];
		if (!item) return;
		if (GameState.get_resource("credits") < item.cost) {
			GameState.log_event("TRADE", "Insufficient credits.", "warning");
			return;
		}
		GameState.modify_resource("credits", -item.cost);
		if (Math.random() <= item.success_chance) {
			GameState.apply_effects(item.success);
			GameState.log_event("TRADE", `${item.name}: deal paid off.`, "info");
		} else {
			GameState.apply_effects(item.fail);
			GameState.log_event("TRADE", `${item.name}: deal went badly.`, "warning");
		}
		this.trade_vessel.stock.splice(item_index, 1);
	},

	get_price_trend(resource_key) {
		return this.price_trend[resource_key] || "steady";
	},

	reset() {
		this.prices = { ...this.BASE_PRICES };
		this.price_trend = { fuel: "steady", food: "steady", munitions: "steady", parts: "steady", medicine: "steady" };
		this.import_offers = [];
		this.delivery_queue = [];
		this.export_offers = [];
		this.offer_refresh_countdown = 3;
		this.trade_vessel = null;
		this.vessel_countdown = 8;
		this._refresh_offers();
	},
};

// ============================================================
// BLACK MARKET MANAGER
// ============================================================
const BlackMarketManager = {
	stock: [],
	stock_refresh_countdown: 4,
	active_addictions: [],

	ITEMS: [
		{ id: "combat_stims", name: "Combat Stims", cost: 8000,
		  desc: "Performance enhancers. Boost morale temporarily.", flavor: "Banned in 12 systems.",
		  effects: { morale: 0.12 },
		  heat_cost: { gm_personal_threat: 0.05, gm_political_heat: 0.03 },
		  addiction_chance: 0.25, addiction_drain: -0.02 },
		{ id: "pleasure_goods", name: "Pleasure Goods", cost: 6000,
		  desc: "Distractions for the masses. Big morale boost.", flavor: "Discreetly distributed.",
		  effects: { morale: 0.18 },
		  heat_cost: { gm_political_heat: 0.05 },
		  addiction_chance: 0.30, addiction_drain: -0.03 },
		{ id: "illegal_weapons", name: "Black Market Weapons", cost: 12000,
		  desc: "Unregistered firearms. Reduces threat level.", flavor: "No serial numbers. No questions.",
		  effects: { munitions: 800, threat_level: -0.08 },
		  heat_cost: { gm_personal_threat: 0.08, gm_political_heat: 0.05 },
		  addiction_chance: 0.0 },
		{ id: "forged_documents", name: "Forged Documents", cost: 10000,
		  desc: "Clean paperwork for dirty deals. Reduces political heat.", flavor: "Indistinguishable from genuine.",
		  effects: { gm_political_heat: -0.15 },
		  heat_cost: { gm_personal_threat: 0.06 },
		  addiction_chance: 0.0 },
		{ id: "intel_dossier", name: "Guild Intel Dossier", cost: 18000,
		  desc: "Confidential Guild documents. Very risky.", flavor: "If they find this, you are finished.",
		  effects: { gm_political_heat: -0.2, threat_level: -0.05 },
		  heat_cost: { gm_personal_threat: 0.15, gm_political_heat: 0.1 },
		  addiction_chance: 0.0 },
		{ id: "smuggled_meds", name: "Smuggled Pharma", cost: 7000,
		  desc: "Restricted medical compounds.", flavor: "Officially does not exist.",
		  effects: { medicine: 600, morale: 0.04 },
		  heat_cost: { gm_personal_threat: 0.03, gm_political_heat: 0.02 },
		  addiction_chance: 0.10, addiction_drain: -0.015 },
		{ id: "rebel_propaganda", name: "Rebel Literature", cost: 4000,
		  desc: "Anti-Guild manifestos. Risky for morale.", flavor: "Reading material for desperate times.",
		  effects: { morale: 0.06, gm_political_heat: 0.08 },
		  heat_cost: { gm_personal_threat: 0.04 },
		  addiction_chance: 0.0 },
		{ id: "shadow_credits", name: "Shadow Credit Stash", cost: 5000,
		  desc: "Untraceable credits. Net positive but heat-generating.", flavor: "These never existed.",
		  effects: { credits: 12000 },
		  heat_cost: { gm_personal_threat: 0.06, gm_political_heat: 0.06 },
		  addiction_chance: 0.0 },
	],

	tick() {
		if (!GameState.black_market_unlocked) return;
		this.stock_refresh_countdown--;
		if (this.stock_refresh_countdown <= 0) {
			this._refresh_stock();
			this.stock_refresh_countdown = 4;
		}
		// Tick addictions
		for (let i = this.active_addictions.length - 1; i >= 0; i--) {
			const a = this.active_addictions[i];
			a.cycles_remaining--;
			GameState.morale = Math.max(0, GameState.morale + a.drain);
			if (a.cycles_remaining <= 0) {
				GameState.log_event("BLACK MARKET", `Addiction to ${a.name} subsided.`, "info");
				this.active_addictions.splice(i, 1);
			}
		}
	},

	unlock() {
		GameState.black_market_unlocked = true;
		this._refresh_stock();
		GameState.log_event("BLACK MARKET", "Underground contacts established.", "info");
	},

	_refresh_stock() {
		this.stock = [];
		const pool = [...this.ITEMS];
		for (let i = 0; i < 5 && pool.length > 0; i++) {
			const idx = Math.floor(Math.random() * pool.length);
			this.stock.push(pool.splice(idx, 1)[0]);
		}
	},

	purchase(item_index) {
		const item = this.stock[item_index];
		if (!item) return;
		if (GameState.get_resource("credits") < item.cost) {
			GameState.log_event("BLACK MARKET", "Insufficient credits.", "warning");
			return;
		}
		GameState.modify_resource("credits", -item.cost);
		GameState.apply_effects(item.effects);
		GameState.apply_effects(item.heat_cost);
		// Roll addiction
		if (item.addiction_chance > 0 && Math.random() < item.addiction_chance) {
			this.active_addictions.push({
				name: item.name,
				drain: item.addiction_drain,
				cycles_remaining: 8 + Math.floor(Math.random() * 8),
			});
			GameState.log_event("BLACK MARKET", `Crew addiction developed: ${item.name}.`, "warning");
		}
		GameState.log_event("BLACK MARKET", `Acquired: ${item.name}.`, "info");
		this.stock.splice(item_index, 1);
	},

	reset() {
		this.stock = [];
		this.stock_refresh_countdown = 4;
		this.active_addictions = [];
	},
};

// ============================================================
// PERIL MANAGER
// ============================================================
const PerilManager = {
	active_perils: [],
	cooldowns: {},

	PERILS: {
		pirate_raid: {
			id: "pirate_raid", category: "combat", sector: "security_intel",
			title: "PIRATE RAID INCOMING",
			desc: "A corsair vessel has locked onto your outer docking ring. They demand tribute or breach the hull.",
			timer: 2, cooldown: 8,
			choices: [
				{ label: "SAFE", text: "Pay the tribute.", cost_desc: "25,000 CR",
				  cost: { credits: -25000 }, effects: { credits: -25000 },
				  result: "Tribute paid. The corsair withdraws." },
				{ label: "MODERATE", text: "Scramble defenses. Repel them.", cost_desc: "1,500 munitions — 60%",
				  cost: { munitions: -1500 }, effects: { munitions: -1500 }, success_chance: 0.6,
				  success_effects: { threat_level: -0.05 },
				  fail_effects: { station_hull: -0.15, crew_total: -200 },
				  result: "Defense successful. Corsair driven off.",
				  result_fail: "Defense failed. Hull damage. Casualties." },
				{ label: "RISKY", text: "Ignore them. Hope they bluff.", cost_desc: "Free — 30%",
				  cost: {}, effects: {}, success_chance: 0.3,
				  success_effects: {}, fail_effects: { station_hull: -0.25, crew_total: -500, morale: -0.1 },
				  result: "They were bluffing. Lucky.",
				  result_fail: "Severe hull damage. Mass casualties." },
			],
			specialist_choice: {
				text: "Specialist coordinates countermeasures.", cost_desc: "800 munitions — 90%",
				cost: { munitions: -800 }, effects: { munitions: -800 }, success_chance: 0.9,
				success_effects: { threat_level: -0.1, morale: 0.03 },
				fail_effects: { station_hull: -0.08 },
				result: "Specialist-led defense was decisive.",
				result_fail: "Specialist could not prevent some damage.",
			},
		},
		hull_breach: {
			id: "hull_breach", category: "combat", sector: "engineering",
			title: "HULL BREACH — SECTOR 7",
			desc: "Catastrophic decompression in Sector 7. Bulkheads failing. Crew evacuating.",
			timer: 2, cooldown: 10,
			choices: [
				{ label: "SAFE", text: "Emergency seal. Full repair.", cost_desc: "800 parts + 12,000 CR",
				  cost: { parts: -800, credits: -12000 }, effects: { parts: -800, credits: -12000 },
				  result: "Breach sealed. Hull restored." },
				{ label: "MODERATE", text: "Partial seal. Repair later.", cost_desc: "300 parts",
				  cost: { parts: -300 }, effects: { parts: -300, hull_integrity: -0.05 },
				  result: "Breach contained. Integrity compromised." },
				{ label: "RISKY", text: "Sacrifice the sector permanently.", cost_desc: "800 crew lost",
				  cost: {}, effects: { crew_total: -800, morale: -0.12 },
				  result: "Sector sealed. Crew inside lost. Station intact." },
			],
			specialist_choice: {
				text: "Specialist leads emergency repair.", cost_desc: "200 parts — guaranteed",
				cost: { parts: -200 }, effects: { parts: -200, hull_integrity: 0.05 },
				result: "Specialist contained the breach in record time.",
			},
		},
		assassination_attempt: {
			id: "assassination_attempt", category: "gm", sector: "security_intel",
			title: "ASSASSINATION ATTEMPT",
			desc: "An operative was intercepted near your quarters. The weapon was Guild-issue.",
			timer: 1, cooldown: 15,
			choices: [
				{ label: "SAFE", text: "Increase security. Full lockdown.", cost_desc: "20,000 CR",
				  cost: { credits: -20000 }, effects: { credits: -20000, gm_personal_threat: -0.2 },
				  result: "Security tightened." },
				{ label: "MODERATE", text: "Internal investigation.", cost_desc: "10,000 CR — 65%",
				  cost: { credits: -10000 }, effects: { credits: -10000 }, success_chance: 0.65,
				  success_effects: { gm_personal_threat: -0.3, gm_political_heat: -0.1 },
				  fail_effects: { gm_personal_threat: 0.1 },
				  result: "Plot uncovered.",
				  result_fail: "Investigation found nothing." },
				{ label: "RISKY", text: "Publicly accuse a rival faction.", cost_desc: "Political risk",
				  cost: {}, effects: { gm_political_heat: 0.2 }, success_chance: 0.5,
				  success_effects: { gm_personal_threat: -0.25 },
				  fail_effects: { gm_political_heat: 0.15, gm_personal_threat: 0.1 },
				  result: "Accusation landed.",
				  result_fail: "Accusation backfired." },
			],
			specialist_choice: {
				text: "Specialist traces the operative's origin.", cost_desc: "5,000 CR — guaranteed",
				cost: { credits: -5000 }, effects: { credits: -5000, gm_personal_threat: -0.35, gm_political_heat: -0.15 },
				result: "Specialist identified the faction behind it.",
			},
		},
		guild_tribunal: {
			id: "guild_tribunal", category: "gm", sector: "politics_info",
			title: "GUILD TRIBUNAL SUMMONED",
			desc: "Guild Central has issued a formal summons regarding alleged misuse of resources.",
			timer: 3, cooldown: 20,
			choices: [
				{ label: "SAFE", text: "Comply fully.", cost_desc: "30,000 CR",
				  cost: { credits: -30000 }, effects: { credits: -30000, gm_political_heat: -0.25 },
				  result: "Tribunal satisfied." },
				{ label: "MODERATE", text: "Negotiate concessions.", cost_desc: "15,000 CR — 60%",
				  cost: { credits: -15000 }, effects: { credits: -15000, gm_political_heat: -0.1 },
				  success_chance: 0.6, success_effects: { gm_political_heat: -0.15 },
				  fail_effects: { gm_political_heat: 0.1 },
				  result: "Negotiation successful.",
				  result_fail: "Negotiations collapsed." },
				{ label: "RISKY", text: "Refuse summons. Declare autonomy.", cost_desc: "Extreme risk",
				  cost: {}, effects: { gm_political_heat: 0.3 }, success_chance: 0.35,
				  success_effects: { morale: 0.08 },
				  fail_effects: { gm_political_heat: 0.2, gm_personal_threat: 0.2 },
				  result: "Autonomy holds.",
				  result_fail: "Refusal escalated." },
			],
			specialist_choice: {
				text: "Specialist prepares legal defense.", cost_desc: "8,000 CR — guaranteed",
				cost: { credits: -8000 }, effects: { credits: -8000, gm_political_heat: -0.3, morale: 0.04 },
				result: "Specialist dismantled the tribunal's case.",
			},
		},
		labor_strike: {
			id: "labor_strike", category: "story", sector: "labor_affairs",
			title: "GENERAL LABOR STRIKE",
			desc: "Union Councils have called a general strike. Productivity drops every cycle.",
			timer: 4, cooldown: 10,
			choices: [
				{ label: "SAFE", text: "Meet union demands.", cost_desc: "25,000 CR + 4,000 food",
				  cost: { credits: -25000, food: -4000 },
				  effects: { credits: -25000, food: -4000, morale: 0.12 },
				  result: "Demands met. Strike ends." },
				{ label: "MODERATE", text: "Partial concessions.", cost_desc: "12,000 CR — 70%",
				  cost: { credits: -12000 }, effects: { credits: -12000 }, success_chance: 0.7,
				  success_effects: { morale: 0.05 },
				  fail_effects: { morale: -0.08, crew_total: -400 },
				  result: "Negotiation worked.",
				  result_fail: "Strike continues." },
				{ label: "RISKY", text: "Declare martial law.", cost_desc: "Severe consequences",
				  cost: {}, effects: { morale: -0.2, gm_political_heat: 0.15, threat_level: 0.1 },
				  result: "Martial law declared." },
			],
			specialist_choice: {
				text: "Specialist mediates between command and councils.", cost_desc: "6,000 CR — guaranteed",
				cost: { credits: -6000 }, effects: { credits: -6000, morale: 0.08, threat_level: -0.03 },
				result: "Specialist brokered a deal.",
			},
		},
		power_grid_failure: {
			id: "power_grid_failure", category: "sector", sector: "engineering",
			title: "POWER GRID FAILURE",
			desc: "Main power has failed in three sectors. Life support on backup.",
			timer: 2, cooldown: 8,
			choices: [
				{ label: "SAFE", text: "Full grid restoration.", cost_desc: "600 parts + 10,000 CR",
				  cost: { parts: -600, credits: -10000 }, effects: { parts: -600, credits: -10000 },
				  result: "Grid restored." },
				{ label: "MODERATE", text: "Reroute power.", cost_desc: "200 parts",
				  cost: { parts: -200 }, effects: { parts: -200, morale: -0.05 },
				  result: "Power rerouted." },
				{ label: "RISKY", text: "Cannibalize backups.", cost_desc: "Future fragility",
				  cost: {}, effects: { hull_integrity: -0.1 },
				  result: "Grid restored. Station fragile." },
			],
			specialist_choice: {
				text: "Specialist reroutes with minimal disruption.", cost_desc: "100 parts",
				cost: { parts: -100 }, effects: { parts: -100, hull_integrity: 0.03 },
				result: "Specialist restored full grid quickly.",
			},
		},
		medical_outbreak: {
			id: "medical_outbreak", category: "sector", sector: "medical",
			title: "PATHOGEN OUTBREAK",
			desc: "Unidentified pathogen spread through Block C. 800 crew symptomatic.",
			timer: 3, cooldown: 12,
			choices: [
				{ label: "SAFE", text: "Full quarantine and treatment.", cost_desc: "1,500 medicine + 18,000 CR",
				  cost: { medicine: -1500, credits: -18000 },
				  effects: { medicine: -1500, credits: -18000 },
				  result: "Outbreak contained." },
				{ label: "MODERATE", text: "Quarantine. Treat worst cases.", cost_desc: "600 medicine",
				  cost: { medicine: -600 },
				  effects: { medicine: -600, crew_total: -200, morale: -0.05 },
				  result: "Contained. Some casualties." },
				{ label: "RISKY", text: "Vent the residential block.", cost_desc: "Brutal",
				  cost: {}, effects: { crew_total: -800, morale: -0.25, gm_political_heat: 0.2 },
				  result: "Block vented. Outbreak ended." },
			],
			specialist_choice: {
				text: "Specialist develops rapid treatment.", cost_desc: "300 medicine",
				cost: { medicine: -300 }, effects: { medicine: -300, morale: 0.04 },
				result: "Specialist synthesized a treatment. No deaths.",
			},
		},
	},

	tick(cycle) {
		for (let i = this.active_perils.length - 1; i >= 0; i--) {
			const p = this.active_perils[i];
			p.timer_remaining--;
			if (p.timer_remaining <= 0) this._expire(i);
		}
		for (const id in this.cooldowns) {
			this.cooldowns[id]--;
			if (this.cooldowns[id] <= 0) delete this.cooldowns[id];
		}
		this._try_spawn(cycle);
	},

	_try_spawn(cycle) {
		const max_active = cycle < 16 ? 1 : (cycle < 36 ? 2 : 3);
		if (this.active_perils.length >= max_active) return;
		const pool = [];
		for (const id in this.PERILS) {
			if (this.cooldowns[id]) continue;
			if (this.active_perils.some(p => p.id === id)) continue;
			pool.push(id);
		}
		if (pool.length === 0) return;
		const spawn_chance = 0.15 + (GameState.threat_level * 0.35);
		if (Math.random() > spawn_chance) return;
		const chosen_id = pool[Math.floor(Math.random() * pool.length)];
		this._spawn(chosen_id);
	},

	_spawn(id) {
		const template = JSON.parse(JSON.stringify(this.PERILS[id]));
		template.timer_remaining = template.timer;
		this.active_perils.push(template);
		this.cooldowns[id] = template.cooldown;
		GameState.log_event("PERIL", `${template.title} — interrupt.`, "critical");
		show_peril_modal(template, this.active_perils.length - 1);
	},

	_expire(index) {
		const p = this.active_perils[index];
		const penalties = {
			combat: { station_hull: -0.15, morale: -0.08 },
			gm: { gm_personal_threat: 0.2, gm_political_heat: 0.15 },
			story: { morale: -0.12, threat_level: 0.1 },
			sector: { hull_integrity: -0.08 },
		};
		GameState.apply_effects(penalties[p.category] || {});
		GameState.log_event("PERIL", `${p.title} — UNRESOLVED.`, "critical");
		this.active_perils.splice(index, 1);
	},

	can_afford(choice) {
		for (const key in choice.cost) {
			if (choice.cost[key] < 0 && GameState.resources[key]) {
				if (GameState.get_resource(key) < Math.abs(choice.cost[key])) return false;
			}
		}
		return true;
	},

	has_specialist_for(peril) {
		if (!peril.specialist_choice) return false;
		return WorkforceManager.has_active_specialist(peril.sector);
	},

	resolve(peril_index, choice_index) {
		const p = this.active_perils[peril_index];
		if (!p) return false;
		let choice;
		if (choice_index === 3) choice = p.specialist_choice;
		else choice = p.choices[choice_index];
		if (!choice) return false;
		if (!this.can_afford(choice)) {
			GameState.log_event("PERIL", `Cannot resolve — insufficient resources.`, "warning");
			return false;
		}
		GameState.apply_effects(choice.effects || {});
		let result_text = choice.result;
		if (choice.success_chance !== undefined) {
			if (Math.random() <= choice.success_chance) {
				GameState.apply_effects(choice.success_effects || {});
				result_text = choice.result;
			} else {
				GameState.apply_effects(choice.fail_effects || {});
				result_text = choice.result_fail;
			}
		}
		if (choice_index === 3) {
			WorkforceManager._add_xp(p.sector, WorkforceManager.XP_ON_PERIL_USE);
		}
		GameState.log_event("PERIL", `${p.title} — ${result_text}`, "warning");
		this.active_perils.splice(peril_index, 1);
		return true;
	},

	reset() {
		this.active_perils = [];
		this.cooldowns = {};
	},
};

function show_peril_modal(peril, peril_index) {
	const modal = document.getElementById("peril-modal");
	const cat_map = {
		combat: "// COMBAT PERIL //",
		gm: "// COMMAND PERIL //",
		story: "// STORY PERIL //",
		sector: "// SECTOR PERIL //",
	};
	document.getElementById("peril-category").textContent = cat_map[peril.category] || "// PERIL //";
	document.getElementById("peril-title").textContent = peril.title;
	document.getElementById("peril-timer").textContent = `EXPIRES IN ${peril.timer_remaining} CYCLES`;
	document.getElementById("peril-desc").textContent = peril.desc;

	const choices_div = document.getElementById("peril-choices");
	let html = "";
	const labels = ["safe", "moderate", "risky"];
	peril.choices.forEach((c, i) => {
		const cls = labels[i] || "safe";
		html += `<button class="peril-choice-btn ${cls}" data-choice="${i}">
			<div class="peril-choice-label">[${c.label}]</div>
			<div class="peril-choice-text">${c.text}</div>
			<div class="peril-choice-cost">${c.cost_desc}</div>
		</button>`;
	});

	if (PerilManager.has_specialist_for(peril)) {
		const spec = peril.specialist_choice;
		const sp_name = WorkforceManager.specialists[peril.sector].name;
		html += `<button class="peril-choice-btn specialist" data-choice="3">
			<div class="peril-choice-label">[SPECIALIST: ${sp_name}]</div>
			<div class="peril-choice-text">${spec.text}</div>
			<div class="peril-choice-cost">${spec.cost_desc}</div>
		</button>`;
	}

	choices_div.innerHTML = html;
	choices_div.querySelectorAll(".peril-choice-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			const idx = parseInt(btn.dataset.choice);
			if (PerilManager.resolve(peril_index, idx)) {
				modal.style.display = "none";
				if (PerilManager.active_perils.length > 0) {
					show_peril_modal(PerilManager.active_perils[0], 0);
				} else {
					refresh_all();
				}
			}
		});
	});

	modal.style.display = "flex";
}

// ============================================================
// THREAT MANAGER
// ============================================================
const ThreatManager = {
	active_threats: [],

	THREAT_TYPES: {
		piracy: {
			id: "piracy", name: "PIRATE INCURSION",
			desc: "Raiders harassing supply lines. Drains credits and fuel each cycle.",
			tick_effects: { credits: -2000, fuel: -200 },
			responses: [
				{ label: "PAY OFF", cost: { credits: -15000 }, success_chance: 1.0 },
				{ label: "FIGHT", cost: { munitions: -800 }, success_chance: 0.7 },
				{ label: "IGNORE", cost: {}, success_chance: 0 },
			],
		},
		mutiny: {
			id: "mutiny", name: "MUTINY BREWING",
			desc: "Unrest spreading. Morale drains each cycle.",
			tick_effects: { morale: -0.05 },
			responses: [
				{ label: "GRANT CONCESSIONS", cost: { credits: -10000, food: -2000 }, success_chance: 0.9 },
				{ label: "ARREST RINGLEADERS", cost: { morale: -0.1 }, success_chance: 0.6 },
				{ label: "WAIT IT OUT", cost: {}, success_chance: 0 },
			],
		},
		hull_breach: {
			id: "hull_breach", name: "MICROFRACTURE PROPAGATION",
			desc: "Damage spreading. Hull integrity erodes each cycle.",
			tick_effects: { hull_integrity: -0.04 },
			responses: [
				{ label: "FULL REPAIR", cost: { parts: -500, credits: -8000 }, success_chance: 1.0 },
				{ label: "PATCH JOB", cost: { parts: -150 }, success_chance: 0.65 },
				{ label: "DELAY", cost: {}, success_chance: 0 },
			],
		},
		plague: {
			id: "plague", name: "PATHOGEN SPREAD",
			desc: "Slow illness. Morale and crew slowly decline.",
			tick_effects: { morale: -0.02, crew_total: -50 },
			responses: [
				{ label: "MASS TREATMENT", cost: { medicine: -800, credits: -10000 }, success_chance: 1.0 },
				{ label: "QUARANTINE", cost: { morale: -0.05 }, success_chance: 0.7 },
				{ label: "LET IT BURN", cost: {}, success_chance: 0 },
			],
		},
	},

	tick() {
		for (const t of this.active_threats) GameState.apply_effects(t.tick_effects);
		this.roll_spawn();
	},

	roll_spawn() {
		const max_threats = GameState.cycle < 15 ? 1 : (GameState.cycle < 35 ? 2 : 3);
		if (this.active_threats.length >= max_threats) return;
		const spawn_chance = 0.1 + (GameState.threat_level * 0.3);
		if (Math.random() > spawn_chance) return;
		const active_ids = this.active_threats.map(t => t.id);
		const available = Object.values(this.THREAT_TYPES).filter(t => !active_ids.includes(t.id));
		if (available.length === 0) return;
		const type = available[Math.floor(Math.random() * available.length)];
		this.active_threats.push(JSON.parse(JSON.stringify(type)));
		GameState.log_event("THREAT", `${type.name} detected.`, "warning");
	},

	respond(threat_index, response_index) {
		const threat = this.active_threats[threat_index];
		if (!threat) return;
		const response = threat.responses[response_index];
		if (!response) return;
		for (const key in response.cost) {
			if (response.cost[key] < 0 && GameState.resources[key]) {
				if (GameState.get_resource(key) < Math.abs(response.cost[key])) {
					GameState.log_event("THREAT", `Cannot afford that response.`, "warning");
					return;
				}
			}
		}
		GameState.apply_effects(response.cost);
		if (Math.random() <= response.success_chance) {
			GameState.log_event("THREAT", `${threat.name} resolved with ${response.label}.`, "info");
			this.active_threats.splice(threat_index, 1);
		} else {
			GameState.log_event("THREAT", `${response.label} failed. ${threat.name} continues.`, "warning");
		}
	},

	reset() { this.active_threats = []; },
};

// ============================================================
// SECTOR EVENT MANAGER
// ============================================================
const COOLDOWN_SHORT = 3;
const COOLDOWN_MEDIUM = 5;
const COOLDOWN_LONG = 8;

const SectorEventManager = {
	cooldowns: {},
	EVENTS: {
		boost_tourism: { id: "boost_tourism", sector: "travel", name: "BOOST TOURISM",
			desc: "Open additional dock slots for civilian transit. Generates revenue and attracts settlers.",
			flavor: "Fresh credits. Fresh faces. Fresh problems.",
			cost: { credits: -2000 }, cooldown: COOLDOWN_MEDIUM,
			effects: { credits: 4000 },
			special: "tourism_crew",
			result: "Tourism expanded. New arrivals processed." },
		short_range_contracts: { id: "short_range_contracts", sector: "travel", name: "SHORT RANGE CONTRACTS",
			desc: "Post local courier work for station ships. Quick payout, no overhead.",
			flavor: "Dangerous work. Decent pay. No questions asked.",
			cost: {}, cooldown: COOLDOWN_SHORT,
			effects: { credits: 6000 }, result: "Contracts posted. Credits incoming." },
		emergency_recall: { id: "emergency_recall", sector: "travel", name: "EMERGENCY RECALL",
			desc: "Cancel all outbound civilian travel. Reduces external threat exposure but crew dislikes the lockdown.",
			flavor: "Nobody leaves until we know what is out there.",
			cost: {}, cooldown: COOLDOWN_LONG,
			effects: { threat_level: -0.05, morale: -0.03 }, result: "Travel cancelled." },
		buy_fuel_bulk: { id: "buy_fuel_bulk", sector: "trade_logistics", name: "BUY FUEL BULK",
			desc: "Direct purchase of 2,000 fuel cells from preferred supplier. No delivery delay.",
			flavor: "The station breathes fuel. Never let it run dry.",
			cost: { credits: -12000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -12000, fuel: 2000 }, result: "2,000 fuel cells acquired." },
		implement_rationing: { id: "implement_rationing", sector: "trade_logistics", name: "IMPLEMENT RATIONING",
			desc: "Cut food allocations station-wide. Slows food consumption next cycle but morale takes a hit.",
			flavor: "They will grumble. They will comply.",
			cost: {}, cooldown: COOLDOWN_MEDIUM,
			effects: { morale: -0.06 },
			special: "rationing",
			result: "Rationing implemented. Crew unhappy but fed." },
		supply_chain_audit: { id: "supply_chain_audit", sector: "trade_logistics", name: "SUPPLY CHAIN AUDIT",
			desc: "Investigate logistics for embezzlement. Recovers stolen credits.",
			flavor: "Someone is always skimming. Always.",
			cost: {}, cooldown: COOLDOWN_LONG,
			effects: { credits: 8000 }, result: "Audit complete. Embezzled credits recovered." },
		deploy_sensor_buoys: { id: "deploy_sensor_buoys", sector: "exploration", name: "DEPLOY SENSOR BUOYS",
			desc: "Launch detection buoys around the station perimeter. Provides early warning of approaching threats and reduces overall threat level.",
			flavor: "You cannot fight what you cannot see.",
			cost: { credits: -8000 }, cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -8000, threat_level: -0.06 }, result: "Sensor buoys deployed." },
		expedition_contract: { id: "expedition_contract", sector: "exploration", name: "POST EXPEDITION CONTRACT",
			desc: "Hire freelance crews to scout the local sector. Pays out on completion.",
			flavor: "Let someone else take the risk. Charge them for the privilege.",
			cost: { credits: -2000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: 10400 }, result: "Expedition contract posted." },
		lockdown_protocol: { id: "lockdown_protocol", sector: "security_intel", name: "LOCKDOWN PROTOCOL",
			desc: "Station-wide security sweep. Significant threat reduction at the cost of crew morale.",
			flavor: "Order restored. Freedom suspended.",
			cost: { credits: -6000 }, cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -6000, threat_level: -0.08, morale: -0.04 }, result: "Lockdown executed." },
		restock_armoury: { id: "restock_armoury", sector: "security_intel", name: "RESTOCK ARMOURY",
			desc: "Direct purchase of 1,000 munitions for station defense. No delivery delay.",
			flavor: "An empty armoury is an invitation.",
			cost: { credits: -8000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -8000, munitions: 1000 }, result: "Armoury restocked." },
		purge_agents: { id: "purge_agents", sector: "security_intel", name: "PURGE SUSPECTED AGENTS",
			desc: "Round up suspected infiltrators. Reduces threat significantly but raises political heat and damages morale.",
			flavor: "Better wrongful arrests than assassination.",
			cost: {}, cooldown: COOLDOWN_LONG,
			effects: { threat_level: -0.1, morale: -0.1, gm_political_heat: 0.1 }, result: "Purge conducted." },
		dispatch_envoy: { id: "dispatch_envoy", sector: "politics_info", name: "DISPATCH ENVOY",
			desc: "Send a diplomatic envoy to placate Guild Central. Reduces political heat.",
			flavor: "Diplomacy is war with paperwork.",
			cost: { credits: -5000 }, cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -5000, gm_political_heat: -0.05 }, result: "Envoy dispatched." },
		broadcast_propaganda: { id: "broadcast_propaganda", sector: "politics_info", name: "BROADCAST PROPAGANDA",
			desc: "Run morale-boosting broadcasts on station channels. Improves crew sentiment.",
			flavor: "The truth is whatever the broadcast says.",
			cost: { credits: -3000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -3000, morale: 0.06 }, result: "Propaganda broadcast." },
		narrative_control: { id: "narrative_control", sector: "politics_info", name: "NARRATIVE CONTROL",
			desc: "Suppress damaging stories before they spread off-station. Major reduction in political heat.",
			flavor: "What they do not know cannot hurt you.",
			cost: { credits: -8000 }, cooldown: COOLDOWN_LONG,
			effects: { credits: -8000, gm_political_heat: -0.12 }, result: "Narrative suppressed." },
		negotiate_unions: { id: "negotiate_unions", sector: "labor_affairs", name: "NEGOTIATE WITH UNIONS",
			desc: "Open formal talks with the Union Councils. Resolves grievances, boosts morale.",
			flavor: "They want to be heard.",
			cost: { credits: -8000 }, cooldown: COOLDOWN_MEDIUM,
			effects: { credits: -8000, morale: 0.05 }, result: "Negotiations successful." },
		grant_rations: { id: "grant_rations", sector: "labor_affairs", name: "GRANT RATION INCREASE",
			desc: "Issue extra food allotments. Significant morale boost at a heavy food cost.",
			flavor: "Full bellies make quieter corridors.",
			cost: {}, cooldown: COOLDOWN_MEDIUM,
			effects: { food: -3000, morale: 0.08 }, result: "Rations increased." },
		mandatory_overtime: { id: "mandatory_overtime", sector: "labor_affairs", name: "MANDATORY OVERTIME",
			desc: "Compel double shifts. Generates extra revenue but tanks morale.",
			flavor: "Rest is a luxury.",
			cost: {}, cooldown: COOLDOWN_LONG,
			effects: { credits: 8000, morale: -0.12 }, result: "Overtime enforced." },
		emergency_repairs: { id: "emergency_repairs", sector: "engineering", name: "EMERGENCY HULL REPAIRS",
			desc: "Patch hull damage with available parts. Restores 10% hull integrity.",
			flavor: "Patch it. Pray it holds.",
			cost: { credits: -5000, parts: -300 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -5000, parts: -300, hull_integrity: 0.1 }, result: "Hull restored." },
		fabrication_run: { id: "fabrication_run", sector: "engineering", name: "FABRICATION RUN",
			desc: "Run the fabrication bays at full capacity. Produces 400 parts.",
			flavor: "Everything breaks eventually.",
			cost: { credits: -6000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -6000, parts: 400 }, result: "Parts produced." },
		power_grid_upgrade: { id: "power_grid_upgrade", sector: "engineering", name: "UPGRADE POWER GRID",
			desc: "Upgrade station power distribution. Improves hull integrity and reduces fuel consumption permanently.",
			flavor: "Efficiency is survival.",
			cost: { credits: -15000 }, cooldown: COOLDOWN_LONG,
			effects: { credits: -15000, hull_integrity: 0.05 },
			special: "fuel_efficiency",
			result: "Grid upgraded. Fuel efficiency improved." },
		restock_medical: { id: "restock_medical", sector: "medical", name: "RESTOCK MEDICAL",
			desc: "Direct purchase of 800 units of medicine.",
			flavor: "You cannot treat the dead.",
			cost: { credits: -6000 }, cooldown: COOLDOWN_SHORT,
			effects: { credits: -6000, medicine: 800 }, result: "Medical restocked." },
		mass_inoculation: { id: "mass_inoculation", sector: "medical", name: "MASS INOCULATION",
			desc: "Vaccinate the entire crew. Reduces threat from outbreaks and slightly improves morale.",
			flavor: "Prevention is cheap.",
			cost: { credits: -10000, medicine: -400 }, cooldown: COOLDOWN_LONG,
			effects: { credits: -10000, medicine: -400, morale: 0.02, threat_level: -0.02 }, result: "Inoculation complete." },
		quarantine_block: { id: "quarantine_block", sector: "medical", name: "QUARANTINE BLOCK",
			desc: "Seal off a residential block to contain potential outbreaks. Reduces threat at morale cost.",
			flavor: "The locked door is the kindest thing.",
			cost: {}, cooldown: COOLDOWN_MEDIUM,
			effects: { morale: -0.06, threat_level: -0.03 }, result: "Block quarantined." },
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
	is_on_cooldown(event_id) { return this.cooldowns[event_id] !== undefined; },
	get_cooldown(event_id) { return this.cooldowns[event_id] || 0; },
	can_afford(event_id) {
		const ev = this.EVENTS[event_id];
		if (!ev) return false;
		for (const key in ev.cost) {
			if (ev.cost[key] < 0 && GameState.get_resource(key) < Math.abs(ev.cost[key])) return false;
		}
		return true;
	},
	execute(event_id) {
		const ev = this.EVENTS[event_id];
		if (!ev) return;
		if (!this.can_afford(event_id)) {
			GameState.log_event("EVENT", `Insufficient resources.`, "warning");
			return;
		}
		GameState.apply_effects(ev.effects);
		// Special handlers
		if (ev.special === "tourism_crew") {
			const new_crew = Math.floor(Math.random() * 21);
			if (new_crew > 0) {
				GameState.crew_total += new_crew;
				GameState.tourism_crew += new_crew;
				GameState.resources.food.delta -= new_crew * 5;
				GameState.log_event("TRAVEL", `${new_crew} new settlers arrived. Food consumption increased.`, "info");
			}
		} else if (ev.special === "rationing") {
			GameState.rationing_cycles = 1;
		} else if (ev.special === "fuel_efficiency") {
			GameState.resources.fuel.delta = Math.min(0, GameState.resources.fuel.delta + 15);
			GameState.log_event("ENGINEERING", `Fuel consumption permanently reduced.`, "info");
		}
		WorkforceManager.on_event_used(ev.sector);
		GameState.log_event(ev.sector.toUpperCase(), ev.result, "info");
		this.cooldowns[event_id] = ev.cooldown;
	},
	reset() { this.cooldowns = {}; },
};

// ============================================================
// UI REFRESH
// ============================================================
function refresh_header() {
	document.getElementById("station-name").textContent = `STATION ${GameState.station_name} // COMMAND DECK`;
	document.getElementById("cycle-display").textContent = `CYCLE ${String(GameState.cycle).padStart(3, "0")}`;
	document.getElementById("gm-name").textContent = `GUILDMASTER: ${GameState.guildmaster_name}`;
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

function format_effect_value(key, val) {
	const labels = {
		credits: "CR", fuel: "fuel", food: "food", munitions: "munitions",
		parts: "parts", medicine: "medicine", crew_total: "crew",
		morale: "morale", threat_level: "threat", station_hull: "hull",
		hull_integrity: "integrity",
		gm_political_heat: "political heat", gm_personal_threat: "personal threat",
	};
	const label = labels[key] || key;
	const sign = val > 0 ? "+" : "";
	if (key === "morale" || key === "threat_level" || key === "station_hull" ||
		key === "hull_integrity" || key === "gm_political_heat" || key === "gm_personal_threat") {
		return `${sign}${Math.round(val * 100)}% ${label}`;
	}
	return `${sign}${val.toLocaleString()} ${label}`;
}

function format_event_cost(ev) {
	const parts = [];
	for (const key in ev.cost) {
		if (ev.cost[key] < 0) {
			const val = Math.abs(ev.cost[key]);
			const labels = { credits: "CR", fuel: "fuel", food: "food",
				munitions: "munitions", parts: "parts", medicine: "medicine" };
			parts.push(`${val.toLocaleString()} ${labels[key] || key}`);
		}
	}
	return parts.join(" + ");
}

function format_event_reward(ev) {
	const parts = [];
	const cost_keys = Object.keys(ev.cost).filter(k => ev.cost[k] < 0);
	for (const key in ev.effects) {
		// Skip negative effects that are just paying the cost
		if (ev.effects[key] < 0 && cost_keys.includes(key)) continue;
		parts.push(format_effect_value(key, ev.effects[key]));
	}
	if (ev.special === "tourism_crew") parts.push("0-20 crew, +5 food/c per arrival");
	if (ev.special === "rationing") parts.push("food consumption -50% next cycle");
	if (ev.special === "fuel_efficiency") parts.push("permanent fuel consumption reduction");
	return parts.join(", ");
}

function refresh_content() {
	const content = document.getElementById("content");
	const sector_key = GameState.active_sector;
	const sector = GameState.sectors[sector_key];

	let html = `<h2>${sector.name.toUpperCase()}</h2>`;
	html += `<p style="color: var(--text-mid); font-size:12px;">STATUS: ${sector.status.toUpperCase()} // CREW: ${sector.crew_assigned} / ${sector.crew_min}</p>`;

	// Specialist banner
	if (WorkforceManager.has_active_specialist(sector_key)) {
		const s = WorkforceManager.specialists[sector_key];
		const rank_name = WorkforceManager.RANK_NAMES[s.rank];
		const rank_class = WorkforceManager.RANK_CLASS[s.rank];
		html += `<p style="margin: 8px 0; font-size: 12px;"><span style="color: var(--accent-ice);">${s.name}</span> <span class="workforce-rank ${rank_class}">[${rank_name}]</span></p>`;
	}

	// Sector-specific extra content
	if (sector_key === "trade_logistics") {
		html += render_trade_extras();
	} else if (sector_key === "security_intel") {
		html += render_security_extras();
	} else if (sector_key === "labor_affairs") {
		html += render_labor_extras();
	}

	html += `<div class="section-title">SUBSECTORS</div>`;
	for (const sub_key in sector.subsectors) {
		const sub = sector.subsectors[sub_key];
		html += `<div class="subsector-row"><span class="subsector-name">${sub.name}</span><span class="subsector-crew">${sub.crew} crew</span><span class="subsector-status ${sub.status}">${sub.status.toUpperCase()}</span></div>`;
	}

	html += `<div class="section-title">SECTOR EVENTS</div>`;
	const events = SectorEventManager.get_events_for_sector(sector_key);
	if (events.length === 0) {
		html += `<p style="color: var(--text-mid); font-size:12px;">No events available.</p>`;
	} else {
		for (const ev of events) {
			const on_cooldown = SectorEventManager.is_on_cooldown(ev.id);
			const affordable = SectorEventManager.can_afford(ev.id);
			let cls = "event-btn";
			let badge = "";
			let disabled = "";
			if (on_cooldown) {
				const cd = SectorEventManager.get_cooldown(ev.id);
				cls += " cooldown";
				badge = `<span class="event-badge cooldown">COOLDOWN: ${cd}c</span>`;
				disabled = "disabled";
			} else if (!affordable) {
				cls += " unaffordable";
				badge = `<span class="event-badge insufficient">INSUFFICIENT</span>`;
				disabled = "disabled";
			}
			const cost_line = format_event_cost(ev);
			const reward_line = format_event_reward(ev);
			html += `<button class="${cls}" data-event="${ev.id}" ${disabled}>
				<div class="event-header">
					<span class="event-name">${ev.name}</span>
					${badge}
				</div>
				<div class="event-desc">${ev.desc}</div>
				<div class="event-flavor">${ev.flavor}</div>
				<div class="event-effects">
					${cost_line ? `<div class="event-cost">COST: ${cost_line}</div>` : ""}
					${reward_line ? `<div class="event-reward">EFFECT: ${reward_line}</div>` : ""}
				</div>
			</button>`;
		}
	}

	content.innerHTML = html;

	content.querySelectorAll(".event-btn").forEach(btn => {
		if (btn.disabled) return;
		btn.addEventListener("click", () => on_sector_event(btn.dataset.event));
	});

	wire_sector_extras();
}

function render_trade_extras() {
	let html = `<div class="section-title">MARKET PRICES</div>`;
	html += `<div class="market-grid">`;
	for (const key of ["fuel", "food", "munitions", "parts", "medicine"]) {
		const price = EconomyManager.prices[key];
		const trend = EconomyManager.get_price_trend(key);
		const arrow = trend === "rising" ? "^" : (trend === "falling" ? "v" : "~");
		html += `<div class="market-card">
			<div class="market-label">${key.toUpperCase()}</div>
			<div class="market-price ${trend}">${price} ${arrow}</div>
		</div>`;
	}
	html += `</div>`;

	html += `<div class="section-title">IMPORTS</div>`;
	if (EconomyManager.import_offers.length === 0) {
		html += `<p style="font-size:11px; color:var(--text-mid);">No offers. Refresh in ${EconomyManager.offer_refresh_countdown} cycles.</p>`;
	} else {
		EconomyManager.import_offers.forEach((offer, i) => {
			const bulk_str = offer.bulk_discount ? " [BULK -15%]" : "";
			html += `<div class="import-offer">
				<div>
					<div class="offer-info-name">${offer.resource.toUpperCase()} x${offer.amount}${bulk_str}</div>
					<div class="offer-info-detail">${offer.total_cost.toLocaleString()} CR // Delivery: ${offer.delivery_cycles}c</div>
				</div>
				<button class="offer-btn" data-action="import" data-index="${i}">ORDER</button>
			</div>`;
		});
	}

	if (EconomyManager.delivery_queue.length > 0) {
		html += `<div class="section-title">IN TRANSIT</div>`;
		EconomyManager.delivery_queue.forEach(o => {
			html += `<div class="delivery-row"><span>${o.resource.toUpperCase()} x${o.amount}</span><span>${o.cycles_remaining}c</span></div>`;
		});
	}

	html += `<div class="section-title">EXPORTS</div>`;
	if (EconomyManager.export_offers.length === 0) {
		html += `<p style="font-size:11px; color:var(--text-mid);">No exports available.</p>`;
	} else {
		EconomyManager.export_offers.forEach(offer => {
			html += `<div class="export-offer">
				<div>
					<div class="offer-info-name">${offer.resource.toUpperCase()} // Up to ${offer.max_amount}</div>
					<div class="offer-info-detail">${offer.price_per_unit} CR/unit (market: ${EconomyManager.prices[offer.resource]} CR)</div>
				</div>
				<button class="offer-btn" data-action="export" data-resource="${offer.resource}" data-amount="${offer.max_amount}">SELL MAX</button>
			</div>`;
		});
	}

	html += `<div class="section-title">TRADE VESSEL</div>`;
	if (!EconomyManager.trade_vessel) {
		html += `<p style="font-size:11px; color:var(--text-mid);">No vessel docked. Next arrival: ~${EconomyManager.vessel_countdown}c.</p>`;
	} else {
		const v = EconomyManager.trade_vessel;
		html += `<div class="vessel-banner">${v.name} DOCKED // DEPARTING IN ${v.cycles_docked}c // ${v.stock.length} ITEMS</div>`;
		html += `<button class="labor-action-btn" id="open-vessel-btn">BROWSE VESSEL CARGO</button>`;
	}

	return html;
}

function render_security_extras() {
	let html = `<div class="section-title">GUILDMASTER STATUS</div>`;
	html += `<div class="gm-status-grid">`;
	const stats = [
		{ label: "HEALTH", val: GameState.gm_health, good_high: true },
		{ label: "POLITICAL HEAT", val: GameState.gm_political_heat, good_high: false },
		{ label: "PERSONAL THREAT", val: GameState.gm_personal_threat, good_high: false },
	];
	for (const s of stats) {
		const pct = Math.floor(s.val * 100);
		let cls = "good";
		if (s.good_high) {
			if (pct < 30) cls = "critical";
			else if (pct < 60) cls = "warning";
		} else {
			if (pct > 70) cls = "critical";
			else if (pct > 40) cls = "warning";
		}
		html += `<div class="gm-stat">
			<div class="gm-stat-label">${s.label}</div>
			<div class="gm-stat-value ${cls}">${pct}%</div>
		</div>`;
	}
	html += `</div>`;

	html += `<div class="section-title">BLACK MARKET</div>`;
	if (!GameState.black_market_unlocked) {
		html += `<div class="bm-locked">ACCESS DENIED — Establish underground contacts to unlock.</div>`;
		const can_unlock = GameState.get_resource("credits") >= 15000;
		html += `<button class="offer-btn" id="unlock-bm-btn" ${can_unlock ? "" : "disabled"} style="width:100%; margin-top:8px;">ESTABLISH CONTACTS [15,000 CR]</button>`;
	} else {
		if (BlackMarketManager.active_addictions.length > 0) {
			html += `<div class="addiction-warning">ACTIVE ADDICTIONS: ${BlackMarketManager.active_addictions.length}<br>`;
			BlackMarketManager.active_addictions.forEach(a => {
				html += `${a.name} — ${a.cycles_remaining}c remaining<br>`;
			});
			html += `</div>`;
		}
		html += `<p style="font-size:10px; color:var(--text-dim); margin-bottom:8px;">Stock refreshes in ${BlackMarketManager.stock_refresh_countdown}c. ${BlackMarketManager.stock.length} items available.</p>`;
		html += `<button class="labor-action-btn" id="open-bm-btn">BROWSE BLACK MARKET</button>`;
	}

	return html;
}

function render_labor_extras() {
	let html = `<div class="labor-button-row">
		<button class="labor-action-btn" id="open-workforce-btn">SPECIALIST PROMOTION</button>
	</div>`;
	return html;
}

function wire_sector_extras() {
	const content = document.getElementById("content");
	content.querySelectorAll("[data-action]").forEach(btn => {
		const action = btn.dataset.action;
		btn.addEventListener("click", () => {
			if (action === "import") {
				EconomyManager.purchase_import(parseInt(btn.dataset.index));
				refresh_all();
			} else if (action === "export") {
				EconomyManager.sell_export(btn.dataset.resource, parseInt(btn.dataset.amount));
				refresh_all();
			} else if (action === "vessel") {
				EconomyManager.purchase_vessel_item(parseInt(btn.dataset.index));
				refresh_all();
			} else if (action === "bm-buy") {
				BlackMarketManager.purchase(parseInt(btn.dataset.index));
				refresh_all();
			}
		});
	});

	const unlock_btn = document.getElementById("unlock-bm-btn");
	if (unlock_btn) {
		unlock_btn.addEventListener("click", () => {
			if (GameState.get_resource("credits") >= 15000) {
				GameState.modify_resource("credits", -15000);
				BlackMarketManager.unlock();
				refresh_all();
			}
		});
	}

	const wf_btn = document.getElementById("open-workforce-btn");
	if (wf_btn) {
		wf_btn.addEventListener("click", show_workforce_modal);
	}

	const vessel_btn = document.getElementById("open-vessel-btn");
	if (vessel_btn) {
		vessel_btn.addEventListener("click", show_vessel_modal);
	}

	const bm_btn = document.getElementById("open-bm-btn");
	if (bm_btn) {
		bm_btn.addEventListener("click", show_bm_modal);
	}
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

function refresh_threats() {
	const panel = document.getElementById("threat-panel");
	if (!panel) return;
	let html = "<h3>ACTIVE THREATS</h3>";
	if (ThreatManager.active_threats.length === 0) {
		html += '<p style="font-size:11px; color:var(--text-mid);">No active threats.</p>';
	} else {
		ThreatManager.active_threats.forEach((threat, i) => {
			html += `<div class="threat-card">`;
			html += `<div class="threat-name">${threat.name}</div>`;
			html += `<div class="threat-desc">${threat.desc}</div>`;
			threat.responses.forEach((resp, ri) => {
				const cost_parts = [];
				for (const key in resp.cost) cost_parts.push(`${resp.cost[key]} ${key}`);
				const cost_str = cost_parts.length > 0 ? ` (${cost_parts.join(", ")})` : "";
				let chance_str = "";
				if (resp.success_chance > 0 && resp.success_chance < 1) {
					chance_str = ` [${Math.floor(resp.success_chance * 100)}%]`;
				}
				html += `<button class="threat-response-btn" data-threat="${i}" data-response="${ri}">${resp.label}${cost_str}${chance_str}</button>`;
			});
			html += `</div>`;
		});
	}
	panel.innerHTML = html;
	panel.querySelectorAll(".threat-response-btn").forEach(btn => {
		btn.addEventListener("click", () => {
			ThreatManager.respond(parseInt(btn.dataset.threat), parseInt(btn.dataset.response));
			refresh_all();
		});
	});
}

function refresh_all() {
	refresh_header();
	refresh_resources();
	refresh_log();
	refresh_content();
	refresh_sector_nav();
	refresh_advance_btn();
	refresh_threats();
}

// ============================================================
// WORKFORCE MODAL
// ============================================================
function show_workforce_modal() {
	render_workforce_list();
	document.getElementById("workforce-modal").style.display = "flex";
}

function render_workforce_list() {
	const list = document.getElementById("workforce-list");
	let html = "";
	for (const sector_key in GameState.sectors) {
		const sector = GameState.sectors[sector_key];
		const has_spec = WorkforceManager.has_active_specialist(sector_key);
		const spec = WorkforceManager.specialists[sector_key];
		const cost = WorkforceManager.get_promotion_cost(sector_key);
		const can_promote = WorkforceManager.can_promote(sector_key);

		html += `<div class="workforce-row">`;
		html += `<div class="workforce-row-header">`;
		html += `<span class="workforce-sector-name">${sector.name.toUpperCase()}</span>`;

		if (has_spec) {
			const rank_name = WorkforceManager.RANK_NAMES[spec.rank];
			const rank_class = WorkforceManager.RANK_CLASS[spec.rank];
			html += `<span class="workforce-spec-info">${spec.name} <span class="workforce-rank ${rank_class}">[${rank_name}]</span></span>`;

			if (spec.rank === WorkforceManager.RANK_CHIEF) {
				html += `<button class="workforce-promote-btn maxed" disabled>MAXED</button>`;
			} else {
				html += `<button class="workforce-promote-btn" data-sector="${sector_key}" ${can_promote ? "" : "disabled"}>PROMOTE [${cost.toLocaleString()} CR]</button>`;
			}
			html += `</div>`;

			const xp_data = WorkforceManager.get_xp_progress(sector_key);
			if (spec.rank === WorkforceManager.RANK_CHIEF) {
				html += `<div class="workforce-xp">XP: MAXED</div>`;
			} else {
				html += `<div class="workforce-xp">XP: ${xp_data.xp} / ${xp_data.next}</div>`;
				const pct = Math.min(100, (xp_data.xp / xp_data.next) * 100);
				html += `<div class="workforce-xp-bar"><div class="workforce-xp-fill" style="width: ${pct}%"></div></div>`;
			}
			html += `<div class="workforce-stats">MISSIONS: ${spec.missions} // PERILS: ${spec.perils}</div>`;
		} else {
			html += `<button class="workforce-promote-btn" data-sector="${sector_key}" ${can_promote ? "" : "disabled"}>PROMOTE [${cost.toLocaleString()} CR]</button>`;
			html += `</div>`;
		}

		html += `</div>`;
	}
	list.innerHTML = html;

	list.querySelectorAll(".workforce-promote-btn[data-sector]").forEach(btn => {
		btn.addEventListener("click", () => {
			if (WorkforceManager.promote(btn.dataset.sector)) {
				render_workforce_list();
			}
		});
	});
}

// ============================================================
// TRADE VESSEL MODAL
// ============================================================
function show_vessel_modal() {
	render_vessel_list();
	document.getElementById("vessel-modal").style.display = "flex";
}

function render_vessel_list() {
	const list = document.getElementById("vessel-list");
	if (!EconomyManager.trade_vessel) {
		list.innerHTML = `<p style="font-size:12px; color:var(--text-mid); text-align:center;">No vessel docked.</p>`;
		return;
	}
	const v = EconomyManager.trade_vessel;
	let html = `<div class="vessel-banner">${v.name} // DEPARTING IN ${v.cycles_docked}c</div>`;
	if (v.stock.length === 0) {
		html += `<p style="font-size:12px; color:var(--text-mid); margin-top:12px;">All cargo cleared.</p>`;
	} else {
		v.stock.forEach((item, i) => {
			const can_afford = GameState.get_resource("credits") >= item.cost;
			html += `<div class="vessel-item">
				<div>
					<div class="offer-info-name">${item.name}</div>
					<div class="offer-info-detail">${item.cost.toLocaleString()} CR // Success: ${Math.floor(item.success_chance * 100)}%</div>
					<div class="offer-info-detail">${item.desc}</div>
					<div class="offer-info-flavor">${item.flavor}</div>
				</div>
				<button class="offer-btn" data-vessel-index="${i}" ${can_afford ? "" : "disabled"}>BUY</button>
			</div>`;
		});
	}
	list.innerHTML = html;
	list.querySelectorAll("[data-vessel-index]").forEach(btn => {
		btn.addEventListener("click", () => {
			EconomyManager.purchase_vessel_item(parseInt(btn.dataset.vesselIndex));
			render_vessel_list();
			refresh_resources();
		});
	});
}

// ============================================================
// BLACK MARKET MODAL
// ============================================================
function show_bm_modal() {
	render_bm_list();
	document.getElementById("bm-modal").style.display = "flex";
}

function render_bm_list() {
	const list = document.getElementById("bm-list");
	let html = "";
	if (BlackMarketManager.active_addictions.length > 0) {
		html += `<div class="addiction-warning">ACTIVE ADDICTIONS: ${BlackMarketManager.active_addictions.length}<br>`;
		BlackMarketManager.active_addictions.forEach(a => {
			html += `${a.name} — ${a.cycles_remaining}c remaining<br>`;
		});
		html += `</div>`;
	}
	html += `<p style="font-size:10px; color:var(--text-dim); margin-bottom:8px;">Stock refreshes in ${BlackMarketManager.stock_refresh_countdown}c.</p>`;
	if (BlackMarketManager.stock.length === 0) {
		html += `<p style="font-size:11px; color:var(--text-mid);">Stock depleted.</p>`;
	} else {
		BlackMarketManager.stock.forEach((item, i) => {
			const heat_parts = [];
			if (item.heat_cost.gm_personal_threat) heat_parts.push(`Threat +${Math.floor(item.heat_cost.gm_personal_threat * 100)}%`);
			if (item.heat_cost.gm_political_heat) heat_parts.push(`Heat +${Math.floor(item.heat_cost.gm_political_heat * 100)}%`);
			if (item.addiction_chance > 0) heat_parts.push(`Addiction: ${Math.floor(item.addiction_chance * 100)}%`);
			const can_afford = GameState.get_resource("credits") >= item.cost;
			html += `<div class="bm-item">
				<div class="bm-item-header">
					<span class="bm-item-name">${item.name}</span>
					<span class="bm-item-cost">${item.cost.toLocaleString()} CR</span>
				</div>
				<div class="bm-item-desc">${item.desc}</div>
				<div class="bm-item-flavor">${item.flavor}</div>
				<div class="bm-item-heat">${heat_parts.join(" // ")}</div>
				<button class="bm-buy-btn" data-bm-index="${i}" ${can_afford ? "" : "disabled"}>ACQUIRE</button>
			</div>`;
		});
	}
	list.innerHTML = html;
	list.querySelectorAll("[data-bm-index]").forEach(btn => {
		btn.addEventListener("click", () => {
			BlackMarketManager.purchase(parseInt(btn.dataset.bmIndex));
			render_bm_list();
			refresh_resources();
		});
	});
}

// ============================================================
// GAME OVER
// ============================================================
const EPITAPHS = {
	combat: [
		"The station did not mourn. Stations never do.",
		"Hull integrity: zero. Legacy: disputed.",
		"The void is patient. You were not.",
	],
	gm: [
		"No successor was named. That was intentional.",
		"The Guild scrubbed your name from the records. Again.",
		"Power is borrowed. Someone called in the debt.",
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
	document.getElementById("game-over-title").textContent = `GUILDMASTER ${GameState.guildmaster_name} — DECEASED`;
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
// ============================================================
// BUILD INDICATOR — randomized accent on each page load
// ============================================================
const BUILD_PALETTES = [
	{ name: "ICE",     accent: "#2194b8", cold: "#1a6b91", border_mid: "#1c303f", border_bright: "#294557", text: "#c7d9e0" },
	{ name: "AMBER",   accent: "#d48210", cold: "#8a5208", border_mid: "#3a2a14", border_bright: "#5a4220", text: "#e0d3c0" },
	{ name: "RUST",    accent: "#bf382b", cold: "#7a2218", border_mid: "#3a1a16", border_bright: "#5a261f", text: "#e0c8c4" },
	{ name: "MOSS",    accent: "#1a8c40", cold: "#0f5828", border_mid: "#172e1f", border_bright: "#244a30", text: "#c4dcc8" },
	{ name: "VIOLET",  accent: "#7b4fa8", cold: "#523070", border_mid: "#2a1f3a", border_bright: "#403058", text: "#d0c4dc" },
	{ name: "CYAN",    accent: "#1ec6c0", cold: "#138682", border_mid: "#143030", border_bright: "#1f4848", text: "#c0dcdc" },
	{ name: "BONE",    accent: "#c8b89a", cold: "#8a7d68", border_mid: "#2c2a24", border_bright: "#46423a", text: "#d8d0c0" },
	{ name: "BLOOD",   accent: "#a01828", cold: "#6a101a", border_mid: "#3a1418", border_bright: "#581c22", text: "#dcc0c4" },
	{ name: "GOLD",    accent: "#c9a032", cold: "#866a20", border_mid: "#2e2614", border_bright: "#48381e", text: "#dcd0a8" },
	{ name: "ROGUE",   accent: "#e0529f", cold: "#963468", border_mid: "#3a1c2c", border_bright: "#582a44", text: "#dcc0d0" },
];

function apply_build_palette() {
	const p = BUILD_PALETTES[Math.floor(Math.random() * BUILD_PALETTES.length)];
	const r = document.documentElement.style;
	r.setProperty("--accent-ice", p.accent);
	r.setProperty("--accent-cold", p.cold);
	r.setProperty("--border-mid", p.border_mid);
	r.setProperty("--border-bright", p.border_bright);
	r.setProperty("--text-bright", p.text);
	console.log(`%cBUILD PALETTE: ${p.name}`, `color: ${p.accent}; font-weight: bold; letter-spacing: 2px;`);
	// Append palette name to welcome subtitle for visual confirmation
	const sub = document.querySelector(".welcome-box .subtitle");
	if (sub) sub.textContent = sub.textContent + ` // BUILD: ${p.name}`;
	return p;
}

function init() {
	apply_build_palette();
	console.log("Guildmaster booting...");
	document.getElementById("start-btn").addEventListener("click", on_start);
	document.getElementById("restart-btn").addEventListener("click", on_restart);
	document.getElementById("advance-btn").addEventListener("click", on_advance);
	document.getElementById("workforce-close-btn").addEventListener("click", () => {
		document.getElementById("workforce-modal").style.display = "none";
		refresh_all();
	});
	document.getElementById("vessel-close-btn").addEventListener("click", () => {
		document.getElementById("vessel-modal").style.display = "none";
		refresh_all();
	});
	document.getElementById("bm-close-btn").addEventListener("click", () => {
		document.getElementById("bm-modal").style.display = "none";
		refresh_all();
	});
	document.querySelectorAll(".sector-btn").forEach(btn => {
		btn.addEventListener("click", () => on_sector_click(btn.dataset.sector));
	});
}

init();
