// Leonida Trophy Guide: a tracker and guide for Grand Theft Auto VI's 55
// PlayStation 5 trophies. Progress lives in localStorage and can be exported
// to a file and imported back. The app fetches only its own two data files
// (data/trophies.json, data/roadmap.json) and makes no other request.

const STORE_KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers';
const KIND_LABELS = {
  story: 'Story',
  side: 'Side content',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  exploration: 'Exploration',
};
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

let trophies = [];
let phases = [];
let earned = new Set(loadStoredEarned());
let openGuides = new Set();
let filters = {
  search: '',
  grade: 'all',
  kind: 'all',
  status: 'all',
  missableOnly: false,
  hiddenOnly: false,
  spoilers: loadStoredSpoilers(),
};

function $(id) {
  return document.getElementById(id);
}

function loadStoredEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((name) => typeof name === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
}

function loadStoredSpoilers() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, filters.spoilers ? '1' : '0');
}

async function loadData() {
  const [trophyDoc, roadmapDoc] = await Promise.all([
    (await fetch('data/trophies.json')).json(),
    (await fetch('data/roadmap.json')).json(),
  ]);
  trophies = trophyDoc.trophies;
  phases = roadmapDoc.phases;
}

function isSpoilerHidden(trophy) {
  return filters.spoilers && (trophy.hidden || trophy.kind === 'story') && !earned.has(trophy.name);
}

function trophyMatches(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.status === 'earned' && !earned.has(trophy.name)) return false;
  if (filters.status === 'unearned' && earned.has(trophy.name)) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.hiddenOnly && !trophy.hidden) return false;
  if (filters.search) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${KIND_LABELS[trophy.kind]}`.toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }
  return true;
}

function gradeCountText() {
  return GRADE_ORDER.map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.name)).length;
    const label = grade[0].toUpperCase() + grade.slice(1);
    return `${label} ${got}/${total}`;
  }).join(' · ');
}

function renderProgress() {
  const total = trophies.length;
  const got = trophies.filter((t) => earned.has(t.name)).length;
  const percent = total === 0 ? 0 : Math.round((got / total) * 100);
  $('progressFill').style.width = `${percent}%`;
  $('progressText').textContent = `${got} of ${total} earned · ${percent}%`;
  $('gradeCount').textContent = gradeCountText();
}

function renderRoadmap() {
  const host = $('roadmap');
  host.replaceChildren();
  for (const phase of phases) {
    const card = document.createElement('article');
    card.className = 'phase';
    const title = document.createElement('h3');
    title.textContent = phase.title;
    const blurb = document.createElement('p');
    blurb.textContent = phase.blurb;
    const members = trophies.filter((t) => t.phase === phase.id);
    const done = members.filter((t) => earned.has(t.name)).length;
    const count = document.createElement('p');
    count.className = 'phase-count';
    count.textContent = `${done} of ${members.length} earned in this phase`;
    const list = document.createElement('ul');
    for (const trophy of members) {
      const item = document.createElement('li');
      if (earned.has(trophy.name)) item.className = 'done';
      const jump = document.createElement('button');
      jump.type = 'button';
      jump.textContent = isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
      jump.addEventListener('click', () => jumpToTrophy(trophy.name));
      item.append(jump);
      list.append(item);
    }
    card.append(title, blurb, count, list);
    host.append(card);
  }
}

function trophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.name = trophy.name;
  if (earned.has(trophy.name)) card.classList.add('earned');
  if (trophy.missable) card.classList.add('missable');

  const head = document.createElement('div');
  head.className = 'card-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => toggleEarned(trophy.name, box.checked));
  box.addEventListener('click', (event) => event.stopPropagation());
  const titleBox = document.createElement('div');
  titleBox.className = 'card-title';
  const name = document.createElement('h3');
  if (earned.has(trophy.name)) name.className = 'earned-name';
  name.textContent = isSpoilerHidden(trophy) ? 'Hidden trophy' : trophy.name;
  titleBox.append(name);
  if (!isSpoilerHidden(trophy)) {
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = trophy.description;
    titleBox.append(desc);
  }
  const grade = document.createElement('span');
  grade.className = `grade ${trophy.grade}`;
  grade.textContent = trophy.grade;
  head.append(box, titleBox, grade);
  head.addEventListener('click', () => toggleGuide(trophy.name));
  card.append(head);

  const tags = document.createElement('div');
  tags.className = 'tags';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = KIND_LABELS[trophy.kind];
  tags.append(kindTag);
  if (trophy.hidden) {
    const hiddenTag = document.createElement('span');
    hiddenTag.className = 'tag hidden-tag';
    hiddenTag.textContent = 'Hidden';
    tags.append(hiddenTag);
  }
  if (trophy.missable) {
    const missableTag = document.createElement('span');
    missableTag.className = 'tag missable-tag';
    missableTag.textContent = 'Missable — do it in Chapter 1';
    tags.append(missableTag);
  }
  if (trophy.count !== undefined) {
    const countTag = document.createElement('span');
    countTag.className = 'tag count-tag';
    countTag.textContent = `Target: ${trophy.countLabel ?? trophy.count}`;
    tags.append(countTag);
  }
  card.append(tags);

  if (isSpoilerHidden(trophy)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler hidden: earn this trophy (or switch spoilers off) to see its name, description and guide.';
    card.append(note);
  } else if (openGuides.has(trophy.name)) {
    const guide = document.createElement('div');
    guide.className = 'guide';
    const text = document.createElement('p');
    text.textContent = trophy.guide;
    const sources = document.createElement('p');
    sources.className = 'sources';
    const label = document.createElement('strong');
    label.textContent = 'Sources: ';
    sources.append(label, document.createTextNode(trophy.sources.join(', ')));
    guide.append(text, sources);
    card.append(guide);
  }
  return card;
}

function renderList() {
  const host = $('list');
  host.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  $('resultCount').textContent = `showing ${shown.length} of ${trophies.length}`;
  if (shown.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No trophies match these filters. Clear the search or loosen a filter.';
    host.append(empty);
    return;
  }
  for (const trophy of shown) host.append(trophyCard(trophy));
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

function toggleEarned(name, checked) {
  if (checked) earned.add(name);
  else earned.delete(name);
  saveEarned();
  renderAll();
}

function toggleGuide(name) {
  if (openGuides.has(name)) openGuides.delete(name);
  else openGuides.add(name);
  renderList();
}

function jumpToTrophy(name) {
  filters.search = '';
  $('search').value = '';
  filters.grade = 'all';
  $('gradeFilter').value = 'all';
  filters.kind = 'all';
  $('kindFilter').value = 'all';
  filters.status = 'all';
  $('statusFilter').value = 'all';
  filters.missableOnly = false;
  $('missableOnly').checked = false;
  filters.hiddenOnly = false;
  $('hiddenOnly').checked = false;
  openGuides.add(name);
  renderAll();
  const card = document.querySelector(`[data-name="${CSS.escape(name)}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    alert('That file is not valid JSON.');
    return;
  }
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) {
    alert('That file has no earned list in it.');
    return;
  }
  const known = new Set(trophies.map((t) => t.name));
  earned = new Set(names.filter((name) => typeof name === 'string' && known.has(name)));
  saveEarned();
  renderAll();
}

function resetProgress() {
  if (earned.size === 0) return;
  if (!confirm(`Clear all ${earned.size} earned trophies? This cannot be undone (export first if you want a backup).`)) return;
  earned = new Set();
  saveEarned();
  renderAll();
}

function bindControls() {
  $('search').addEventListener('input', (event) => {
    filters.search = event.target.value.trim().toLowerCase();
    renderList();
  });
  $('gradeFilter').addEventListener('change', (event) => {
    filters.grade = event.target.value;
    renderList();
  });
  $('kindFilter').addEventListener('change', (event) => {
    filters.kind = event.target.value;
    renderList();
  });
  $('statusFilter').addEventListener('change', (event) => {
    filters.status = event.target.value;
    renderList();
  });
  $('missableOnly').addEventListener('change', (event) => {
    filters.missableOnly = event.target.checked;
    renderList();
  });
  $('hiddenOnly').addEventListener('change', (event) => {
    filters.hiddenOnly = event.target.checked;
    renderList();
  });
  $('spoilerToggle').checked = filters.spoilers;
  $('spoilerToggle').addEventListener('change', (event) => {
    filters.spoilers = event.target.checked;
    saveSpoilers();
    renderAll();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', resetProgress);
}

try {
  await loadData();
  bindControls();
  renderAll();
} catch (error) {
  const host = $('list');
  host.replaceChildren();
  const message = document.createElement('p');
  message.className = 'empty';
  message.textContent = 'The trophy data could not be loaded. Serve app/ with a static server and reload.';
  host.append(message);
}
