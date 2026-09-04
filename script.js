// ---------- state ----------
let currentFilter = "";

// ---------- element refs ----------
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const statsEl = document.getElementById("stats");
const backdrop = document.getElementById("backdrop");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");

const f = {
    id: document.getElementById("f-id"),
    title: document.getElementById("f-title"),
    authors: document.getElementById("f-authors"),
    venue: document.getElementById("f-venue"),
    type: document.getElementById("f-type"),
    status: document.getElementById("f-status"),
    deadline: document.getElementById("f-deadline"),
    link: document.getElementById("f-link"),
    notes: document.getElementById("f-notes"),
};

// ---------- helpers ----------
function esc(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, c => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}

function fmtDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso) {
    if (!iso) return null;
    const diff = (new Date(iso) - new Date()) / 86400000;
    return Math.ceil(diff);
}

// ---------- API ----------
async function api(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Request failed");
    }
    return res.status === 204 ? null : res.json();
}

// ---------- render ----------
async function loadStats() {
    const s = await api("api/stats.php");
    const cards = [
        { k: "Total", cls: "total" },
        { k: "Drafting", cls: "" },
        { k: "Submitted", cls: "" },
        { k: "Under Review", cls: "" },
        { k: "Accepted", cls: "accepted" },
        { k: "Rejected", cls: "" },
    ];
    statsEl.innerHTML = cards.map(c => `
        <div class="stat ${c.cls}">
            <div class="n">${s[c.k] ?? 0}</div>
            <div class="l">${c.k}</div>
        </div>`).join("");
}

async function loadPapers() {
    const url = currentFilter
        ? `api/papers.php?status=${encodeURIComponent(currentFilter)}`
        : "api/papers.php";
    const papers = await api(url);

    if (!papers.length) {
        listEl.innerHTML = "";
        emptyEl.hidden = false;
        return;
    }
    emptyEl.hidden = true;

    listEl.innerHTML = papers.map(p => {
        const badgeCls = "badge-" + p.status.replace(/\s+/g, "");
        const dl = fmtDate(p.deadline);
        const dleft = daysUntil(p.deadline);
        const open = p.status !== "Accepted" && p.status !== "Rejected";
        const overdue = dleft !== null && dleft < 0 && open;
        const soon = dleft !== null && dleft >= 0 && dleft <= 14 && open;
        let dueNote = "";
        if (overdue) dueNote = " (overdue)";
        else if (soon) dueNote = ` (${dleft}d)`;

        const titleHtml = p.link
            ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.title)}</a>`
            : esc(p.title);
        const metaParts = [];
        if (p.venue) metaParts.push(esc(p.venue));
        if (p.authors) metaParts.push(esc(p.authors));

        return `
        <article class="paper">
            <div class="p-main">
                <div class="p-title">${titleHtml}</div>
                <div class="p-meta">${metaParts.join(" &middot; ") || "&mdash;"}</div>
                ${p.notes ? `<div class="p-notes">${esc(p.notes)}</div>` : ""}
                <div class="p-actions">
                    <button class="icon-btn" onclick="openEdit(${p.id})">Edit</button>
                    <button class="icon-btn danger" onclick="removePaper(${p.id})">Delete</button>
                </div>
            </div>
            <div class="p-side">
                <span class="badge ${badgeCls}">${esc(p.status)}</span>
                <span class="p-type">${esc(p.type)}</span>
                ${dl ? `<span class="deadline ${soon || overdue ? "soon" : ""}">Due ${dl}${dueNote}</span>` : ""}
            </div>
        </article>`;
    }).join("");
}

async function refresh() {
    await Promise.all([loadStats(), loadPapers()]);
}

// ---------- modal ----------
function openModal(edit = false) {
    modalTitle.textContent = edit ? "Edit paper" : "Add paper";
    formError.hidden = true;
    backdrop.hidden = false;
    f.title.focus();
}
function closeModal() { backdrop.hidden = true; }

function clearForm() {
    Object.values(f).forEach(el => { el.value = ""; });
    f.type.value = "Journal";
    f.status.value = "Drafting";
}

function openNew() {
    clearForm();
    openModal(false);
}

async function openEdit(id) {
    const papers = await api("api/papers.php");
    const p = papers.find(x => Number(x.id) === Number(id));
    if (!p) return;
    f.id.value = p.id;
    f.title.value = p.title || "";
    f.authors.value = p.authors || "";
    f.venue.value = p.venue || "";
    f.type.value = p.type || "Journal";
    f.status.value = p.status || "Drafting";
    f.deadline.value = p.deadline || "";
    f.link.value = p.link || "";
    f.notes.value = p.notes || "";
    openModal(true);
}

async function save() {
    const payload = {
        title: f.title.value.trim(),
        authors: f.authors.value.trim(),
        venue: f.venue.value.trim(),
        type: f.type.value,
        status: f.status.value,
        deadline: f.deadline.value || null,
        link: f.link.value.trim(),
        notes: f.notes.value.trim(),
    };
    if (!payload.title) {
        formError.textContent = "Title is required.";
        formError.hidden = false;
        return;
    }
    try {
        const id = f.id.value;
        if (id) {
            await api(`api/papers.php?id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } else {
            await api("api/papers.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }
        closeModal();
        refresh();
    } catch (e) {
        formError.textContent = e.message;
        formError.hidden = false;
    }
}

async function removePaper(id) {
    if (!confirm("Delete this paper?")) return;
    await api(`api/papers.php?id=${id}`, { method: "DELETE" });
    refresh();
}

// ---------- events ----------
document.getElementById("newBtn").onclick = openNew;
document.getElementById("emptyAdd").onclick = openNew;
document.getElementById("closeModal").onclick = closeModal;
document.getElementById("cancelBtn").onclick = closeModal;
document.getElementById("saveBtn").onclick = save;
backdrop.onclick = e => { if (e.target === backdrop) closeModal(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

document.getElementById("filters").addEventListener("click", e => {
    if (!e.target.classList.contains("chip")) return;
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
    currentFilter = e.target.dataset.status;
    loadPapers();
});

// expose for inline onclick
window.openEdit = openEdit;
window.removePaper = removePaper;

// ---------- init ----------
refresh();
