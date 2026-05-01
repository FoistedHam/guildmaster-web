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
				armoury:           { name: "Armoury",           crew: 70, status: "nominal" },
				station_security:  { name: "Station Security",  crew: 90, status: "nominal" },
				espionage:         { name: "Espionage",         crew: 80, status: "nominal" },
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
				union_councils:      { name: "Union Councils",      crew: 140, status: "nominal" },
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
				triage_care:          { name: "Triage & Care",         crew: 180, status: "nominal" },
				biomedical_research:  { name: "Biomedical Research",   crew: 150, status: "nominal" },
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
		this.log_event("CYCLE", `Guildmaster ${this.guildmaster_name} assumes command.`, "info");
	},

	advance_cycle() {
		if (!this.game_active) return;
		this.cycle++;
		for (const key in this.resources) {
			const r = this.resources[key];
			r.value = Math.max(0, r.value + r.delta);
		}
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
			return this._game_over("Political heat reached terminal levels. Guild Central has stripped your authority.", "gm");
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
	html += `
		<div class="${crew_class}">
			<div class="resource-label">CREW</div>
			<div class="resource-value">${GameState.crew_total.toLocaleString()}</div>
		</div>
	`;

	for (const key in GameState.resources) {
		const r = GameState.resources[key];
		const pct = GameState.get_resource_pct(key);
		let cls = "resource-card";
		if (pct < 0.2) cls += " critical";
		else if (pct < 0.4) cls += " low";

		const delta_sign = r.delta > 0 ? "+" : "";
		html += `
			<div class="${cls}">
				<div class="resource-label">${r.label}</div>
				<div class="resource-value">${r.value.toLocaleString()}</div>
				<div class="resource-delta">${delta_sign}${r.delta}</div>
			</div>
		`;
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
		html += `
			<div class="subsector-row">
				<span class="subsector-name">${sub.name}</span>
				<span class="subsector-crew">${sub.crew} crew</span>
				<span class="subsector-status ${sub.status}">${sub.status.toUpperCase()}</span>
			</div>
		`;
	}

	html += `<div class="section-title">SECTOR EVENTS</div>`;
	html += `<p style="color: var(--text-mid); font-size:12px;">Events coming soon.</p>`;

	content.innerHTML = html;
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
		<div class="stat-item">
			<div class="stat-label">CYCLES SERVED</div>
			<div class="stat-value">${GameState.cycle}</div>
		</div>
		<div class="stat-item">
			<div class="stat-label">FINAL CREW</div>
			<div class="stat-value">${GameState.crew_total.toLocaleString()}</div>
		</div>
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

function on_start() {
	const name = document.getElementById("gm-name-input").value.trim() || "UNKNOWN";
	GameState.new_game(name.toUpperCase());
	document.getElementById("welcome-screen").style.display = "none";
	document.getElementById("app").style.display = "grid";
	refresh_all();
}

function on_restart() {
	location.reload();
}

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
