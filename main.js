// ============================================================
// GAMESTATE
// ============================================================
const GameState = {
	station_name: "PERIPHERY-9",
	guildmaster_name: "UNKNOWN",
	cycle: 1,
	game_active: true,

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

	sectors: {
		travel:          { name: "Travel",            status: "nominal" },
		trade_logistics: { name: "Trade & Logistics", status: "nominal" },
		exploration:     { name: "Exploration",       status: "nominal" },
		security_intel:  { name: "Security & Intel",  status: "nominal" },
		politics_info:   { name: "Politics & Info",   status: "nominal" },
		labor_affairs:   { name: "Labor & Affairs",   status: "nominal" },
		engineering:     { name: "Engineering",       status: "nominal" },
		medical:         { name: "Medical",           status: "nominal" },
	},

	active_sector: "travel",
	event_log: [],

	advance_cycle() {
		this.cycle++;
		for (const key in this.resources) {
			const r = this.resources[key];
			r.value = Math.max(0, r.value + r.delta);
		}
		this.log_event("CYCLE", `Cycle ${this.cycle} begins.`, "info");
	},

	log_event(category, message, severity) {
		this.event_log.unshift({
			cycle: this.cycle,
			category: category,
			message: message,
			severity: severity,
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
	document.getElementById("status-line").textContent =
		`MORALE: ${GameState.get_morale_label()} // THREAT: ${GameState.get_threat_label()}`;
}

function refresh_resources() {
	const bar = document.getElementById("resource-bar");
	let html = "";

	// Crew card first
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

	// Resource cards
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
		html += "<p>Awaiting events...</p>";
	} else {
		for (const entry of GameState.event_log.slice(0, 10)) {
			html += `<p style="font-size:11px; margin-bottom:4px;">C${String(entry.cycle).padStart(3,"0")} [${entry.category}] ${entry.message}</p>`;
		}
	}
	log_div.innerHTML = html;
}

function refresh_content() {
	const content = document.getElementById("content");
	const sector = GameState.sectors[GameState.active_sector];
	content.innerHTML = `
		<h2>${sector.name.toUpperCase()}</h2>
		<p>Status: ${sector.status.toUpperCase()}</p>
		<p style="margin-top:16px; color: var(--text-mid);">Sector content coming soon.</p>
	`;
}

function refresh_sector_nav() {
	const buttons = document.querySelectorAll(".sector-btn");
	buttons.forEach(btn => {
		btn.classList.toggle("active", btn.dataset.sector === GameState.active_sector);
	});
}

function refresh_all() {
	refresh_header();
	refresh_resources();
	refresh_log();
	refresh_content();
	refresh_sector_nav();
}

// ============================================================
// EVENT HANDLERS
// ============================================================
function on_advance() {
	GameState.advance_cycle();
	refresh_all();
}

function on_sector_click(sector_key) {
	GameState.active_sector = sector_key;
	refresh_all();
}

// ============================================================
// INIT
// ============================================================
function init() {
	console.log("Guildmaster booting...");

	document.querySelectorAll(".sector-btn").forEach(btn => {
		btn.addEventListener("click", () => on_sector_click(btn.dataset.sector));
	});

	document.getElementById("advance-btn").addEventListener("click", on_advance);

	refresh_all();
}

init();
