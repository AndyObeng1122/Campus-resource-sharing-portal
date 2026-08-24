const state = {
	activeView: "library",
	query: "",
	filter: "All resources",
	resources: [],
	saved: JSON.parse(localStorage.getItem("ba-saved") || "[]"),
	activeResource: null,
};

const seedResources = [
	{
		id: "research-playbook",
		title: "The field research playbook",
		type: "Guide",
		description: "A practical guide to planning interviews, finding patterns, and turning notes into decisions.",
		author: "Maya Chen",
		date: "Aug 18, 2026",
		accent: "coral",
	},
	{
		id: "service-blueprint",
		title: "Service blueprint canvas",
		type: "Template",
		description: "Map the frontstage, backstage, and handoffs that shape your customer's experience.",
		author: "Studio team",
		date: "Aug 12, 2026",
		accent: "blue",
	},
	{
		id: "interview-kit",
		title: "Interview question kit",
		type: "Toolkit",
		description: "Thoughtful prompts for getting past the first answer and into what people really need.",
		author: "Alex Rivera",
		date: "Aug 04, 2026",
		accent: "yellow",
	},
	{
		id: "insight-library",
		title: "From evidence to insight",
		type: "Course",
		description: "Learn a lighter way to synthesize messy research into a story your team can use.",
		author: "Maya Chen",
		date: "Jul 27, 2026",
		accent: "green",
	},
];

const app = document.querySelector("#app");

async function loadResources() {
	try {
		const response = await fetch("/api/resources");
		state.resources = response.ok ? await response.json() : seedResources;
	} catch {
		state.resources = JSON.parse(localStorage.getItem("ba-resources") || "null") || seedResources;
	}
	render();
}

function icon(name) {
	const icons = {
		search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>',
		plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
		arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
		upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M5 16v3h14v-3"/></svg>',
		library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 5.5V21m5-14h7"/></svg>',
		bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"/></svg>',
		settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m19.4 15 .1 2.2-2 1.2-1.8-1.2a7.7 7.7 0 0 1-2 .8L13 20h-2l-.7-2a7.7 7.7 0 0 1-2-.8l-1.8 1.2-2-1.2.1-2.2a7.8 7.8 0 0 1-1-1.8L2 12l1.6-1.2a7.8 7.8 0 0 1 1-1.8l-.1-2.2 2-1.2 1.8 1.2a7.7 7.7 0 0 1 2-.8L11 4h2l.7 2a7.7 7.7 0 0 1 2 .8l1.8-1.2 2 1.2-.1 2.2a7.8 7.8 0 0 1 1 1.8L22 12l-1.6 1.2a7.8 7.8 0 0 1-1 1.8Z"/></svg>',
	};
	return icons[name] || "";
}

function filteredResources() {
	const query = state.query.toLowerCase();
	return state.resources.filter((resource) => {
		const matchesQuery = !query || `${resource.title} ${resource.description} ${resource.type}`.toLowerCase().includes(query);
		const matchesFilter = state.filter === "All resources" || resource.type === state.filter;
		return matchesQuery && matchesFilter;
	});
}

function resourceCard(resource) {
	const isSaved = state.saved.includes(resource.id);
	return `<article class="resource-card">
		<div class="card-art art-${resource.accent}"><span>${resource.type}</span><div class="art-mark">${resource.type === "Template" ? "▦" : resource.type === "Toolkit" ? "✳" : "↗"}</div></div>
		<div class="card-body"><div class="card-meta"><span>${resource.type}</span><span>${resource.date}</span></div><h3>${resource.title}</h3><p>${resource.description}</p><div class="card-footer"><span class="author"><span class="avatar">${resource.author.charAt(0)}</span>${resource.author}</span><div class="card-actions"><button class="icon-button ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Remove bookmark" : "Save resource"}" data-save="${resource.id}">${icon("bookmark")}</button><button class="icon-button" aria-label="Open resource" data-open="${resource.id}">${icon("arrow")}</button></div></div></div>
	</article>`;
}

function renderLibrary() {
	const resources = filteredResources();
	return `<section class="content-area">
		<div class="welcome-row"><div><p class="eyebrow">Good morning, Alex <span class="sun">✦</span></p><h1>A better way to<br><em>keep learning.</em></h1><p class="lede">Your shared shelf for the ideas, tools, and references that keep good work moving.</p></div><button class="primary-button" data-view="upload">${icon("plus")}Add resource</button></div>
		<div class="search-panel"><div class="search-box">${icon("search")}<input id="search" type="search" placeholder="Search your library" value="${state.query}" aria-label="Search your library"></div><div class="filters">${["All resources", "Guide", "Template", "Toolkit", "Course"].map((filter) => `<button class="filter ${state.filter === filter ? "selected" : ""}" data-filter="${filter}">${filter}</button>`).join("")}</div></div>
		<div class="section-heading"><div><p class="eyebrow">Your library</p><h2>${state.query ? "Search results" : "Recently added"}</h2></div><span class="count">${resources.length} ${resources.length === 1 ? "resource" : "resources"}</span></div>
		<div class="resource-grid">${resources.length ? resources.map(resourceCard).join("") : '<div class="empty-state">No resources match that search.<button class="text-button" data-view="upload">Add the first one ' + icon("arrow") + '</button></div>'}</div>
	</section>`;
}

function renderUpload() {
	return `<section class="content-area upload-area"><button class="back-button" data-view="library">← Back to library</button><div class="upload-header"><p class="eyebrow">Grow the shelf</p><h1>Share something<br><em>worth keeping.</em></h1><p class="lede">Add a useful guide, a sharp observation, or a tool your future self will thank you for.</p></div><form id="upload-form" class="upload-form"><label>Resource title<input name="title" required placeholder="e.g. The beginner's guide to synthesis"></label><label>Short description<textarea name="description" required placeholder="What makes this useful?"></textarea></label><div class="form-row"><label>Resource type<select name="type"><option>Guide</option><option>Template</option><option>Toolkit</option><option>Course</option></select></label><label>Author<input name="author" required value="Alex Rivera"></label></div><label class="dropzone">${icon("upload")}<strong>Drop a file here or browse</strong><span>PDF, DOCX, or link up to 25MB</span><input type="file" name="file"></label><button class="primary-button" type="submit">Publish resource ${icon("arrow")}</button><p class="form-status" aria-live="polite"></p></form></section>`;
}

function renderSaved() {
	const savedResources = state.resources.filter((resource) => state.saved.includes(resource.id));
	return `<section class="content-area"><div class="welcome-row"><div><p class="eyebrow">Your shortlist</p><h1>Saved for<br><em>later.</em></h1><p class="lede">Keep the resources you want close at hand. Your saved collection will appear here.</p></div></div>${savedResources.length ? `<div class="resource-grid saved-grid">${savedResources.map(resourceCard).join("")}</div>` : '<div class="empty-state saved-empty"><span class="saved-icon">♡</span><strong>No saved resources yet</strong><span>Tap the bookmark on a resource to keep it here.</span><button class="text-button" data-view="library">Browse library ' + icon("arrow") + '</button></div>'}</section>`;
}

function renderDetail() {
	const resource = state.resources.find((item) => item.id === state.activeResource);
	if (!resource) return renderLibrary();
	return `<section class="content-area detail-area"><button class="back-button" data-view="library">← Back to library</button><div class="detail-art art-${resource.accent}"><span>${resource.type}</span><div class="art-mark">${resource.type === "Template" ? "▦" : resource.type === "Toolkit" ? "✳" : "↗"}</div></div><div class="detail-copy"><p class="eyebrow">${resource.type} · ${resource.date}</p><h1>${resource.title}</h1><p class="detail-description">${resource.description}</p><div class="detail-byline"><span class="avatar">${resource.author.charAt(0)}</span><span>Added by <b>${resource.author}</b></span></div><button class="primary-button" data-save="${resource.id}">${state.saved.includes(resource.id) ? "Remove bookmark" : "Save to library"} ${icon("bookmark")}</button></div></section>`;
}

function renderSettings() {
	return `<section class="content-area settings-area"><p class="eyebrow">Workspace preferences</p><h1>Make it<br><em>yours.</em></h1><div class="settings-list"><label>Workspace name<input value="Bright Archive"></label><label>Default resource view<select><option>Recently added</option><option>Saved first</option></select></label><label class="toggle-row"><span><b>Compact cards</b><small>Fit more resources on screen</small></span><input type="checkbox"></label><button class="primary-button" data-view="library">Save preferences ${icon("arrow")}</button></div></section>`;
}

function render() {
	app.innerHTML = `<div class="shell"><aside class="sidebar"><a class="brand" href="#" data-view="library"><span class="brand-mark">b</span><span>bright<br><b>archive</b></span></a><nav><p class="nav-label">Workspace</p><button class="nav-item ${state.activeView === "library" ? "active" : ""}" data-view="library">${icon("library")}Library <span>${state.resources.length}</span></button><button class="nav-item ${state.activeView === "saved" ? "active" : ""}" data-view="saved">${icon("bookmark")}Saved <span>${state.saved.length}</span></button></nav><div class="sidebar-bottom"><button class="nav-item ${state.activeView === "settings" ? "active" : ""}" data-view="settings">${icon("settings")}Settings</button><div class="profile"><span class="avatar">AR</span><span><b>Alex Rivera</b><small>Personal workspace</small></span><span class="dots">•••</span></div></div></aside><main>${state.activeView === "upload" ? renderUpload() : state.activeView === "saved" ? renderSaved() : state.activeView === "detail" ? renderDetail() : state.activeView === "settings" ? renderSettings() : renderLibrary()}</main></div>`;
	bindEvents();
}

function bindEvents() {
	app.querySelectorAll("[data-view]").forEach((element) => element.addEventListener("click", (event) => {
		event.preventDefault();
		state.activeView = element.dataset.view;
		render();
	}));
	app.querySelectorAll("[data-filter]").forEach((element) => element.addEventListener("click", () => { state.filter = element.dataset.filter; render(); }));
	app.querySelectorAll("[data-open]").forEach((element) => element.addEventListener("click", () => { state.activeResource = element.dataset.open; state.activeView = "detail"; render(); }));
	app.querySelectorAll("[data-save]").forEach((element) => element.addEventListener("click", (event) => { event.stopPropagation(); const id = element.dataset.save; state.saved = state.saved.includes(id) ? state.saved.filter((savedId) => savedId !== id) : [...state.saved, id]; localStorage.setItem("ba-saved", JSON.stringify(state.saved)); if (state.activeView === "detail") render(); else render(); }));
	const search = app.querySelector("#search");
	if (search) search.addEventListener("input", (event) => { state.query = event.target.value; render(); app.querySelector("#search").focus(); app.querySelector("#search").setSelectionRange(state.query.length, state.query.length); });
	const form = app.querySelector("#upload-form");
	if (form) form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const data = Object.fromEntries(new FormData(form));
		const resource = { id: `resource-${Date.now()}`, title: data.title, description: data.description, type: data.type, author: data.author, fileName: data.file?.name || "", date: "Just now", accent: "coral" };
		if (data.file?.size) {
			if (data.file.size > 25 * 1024 * 1024) { form.querySelector(".form-status").textContent = "That file is larger than 25MB."; return; }
			resource.fileData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(",")[1]); reader.onerror = reject; reader.readAsDataURL(data.file); });
		}
		try { const response = await fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resource) }); if (!response.ok) throw new Error("Upload failed"); } catch { localStorage.setItem("ba-resources", JSON.stringify([resource, ...state.resources])); }
		state.resources.unshift(resource); state.activeView = "library"; render();
	});
}

render();
loadResources();
