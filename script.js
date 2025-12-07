
// Простая клиентская "база" и логика
// Данные: matches (массив матчей), heroes (справочник), maps (справочник)
// Каждый матч: {mode, hero, player, map, result, ts}

// --- helpers ---
const $ = id => document.getElementById(id);

let heroes = [];
let maps = [];
let matches = []; // main dataset

// load static data
async function loadStatic(){
  try {
    const h = await fetch('data/heroes.json').then(r=>r.json());
    const m = await fetch('data/maps.json').then(r=>r.json());
    heroes = h;
    maps = m;
  } catch(e){
    console.error('Не удалось загрузить справочники', e);
    heroes = [];
    maps = [];
  }
  populateSelects();
}

function populateSelects(){
  const heroSel = $('hero');
  const mapSel = $('map');
  const filterMap = $('filterMap');
  const filterHero = $('filterHero');
  heroSel.innerHTML=''; mapSel.innerHTML=''; filterMap.innerHTML='<option value=\"\">Все карты</option>'; filterHero.innerHTML='<option value=\"\">Все герои</option>';
  heroes.forEach(h=>{
    heroSel.insertAdjacentHTML('beforeend', `<option value="${h.name}">${h.name}</option>`);
    filterHero.insertAdjacentHTML('beforeend', `<option value="${h.name}">${h.name}</option>`);
  });
  maps.forEach(m=>{
    mapSel.insertAdjacentHTML('beforeend', `<option value="${m}">${m}</option>`);
    filterMap.insertAdjacentHTML('beforeend', `<option value="${m}">${m}</option>`);
  });
}

// --- local persistence ---
function saveLocal(){
  const should = $('saveLocal').checked;
  if(!should) return;
  localStorage.setItem('unmatched_matches_v1', JSON.stringify(matches));
}
function loadLocal(){
  const raw = localStorage.getItem('unmatched_matches_v1');
  if(raw){ try{ matches = JSON.parse(raw);}catch(e){matches=[]} }
}

// reset data
function resetAll(){
  if(!confirm('Сбросить всю локальную статистику?')) return;
  matches = [];
  saveLocal();
  updateAll();
}

// add match
function addMatch(){
  const mode = $('mode').value;
  const hero = $('hero').value;
  const player = $('player').value.trim();
  const map = $('map').value;
  const result = $('result').value;
  if(!player){ alert('Введите имя игрока'); return; }

  const match = { mode, hero, player, map, result, ts: Date.now() };
  matches.push(match);
  saveLocal();
  updateAll();
  $('player').value='';
}

// stats calculators
function calcHeroStats(filterMap='', filterHero=''){
  const byHero = {};
  matches.forEach(m=>{
    if(filterMap && m.map !== filterMap) return;
    if(filterHero && m.hero !== filterHero) return;
    if(!byHero[m.hero]) byHero[m.hero] = {win:0, loss:0, total:0};
    byHero[m.hero][m.result]++;
    byHero[m.hero].total++;
  });
  return byHero;
}
function calcPlayerStats(filterMap='', filterHero=''){
  const byPlayer = {};
  matches.forEach(m=>{
    if(filterMap && m.map !== filterMap) return;
    if(filterHero && m.hero !== filterHero) return;
    const key = m.player;
    if(!byPlayer[key]) byPlayer[key] = {win:0, loss:0, total:0};
    byPlayer[key][m.result]++;
    byPlayer[key].total++;
  });
  return byPlayer;
}

// charts
let heroChart = null;
let playerChart = null;
function renderHeroChart(dataObj){
  const labels = Object.keys(dataObj);
  const wins = labels.map(l=>dataObj[l].win);
  const loss = labels.map(l=>dataObj[l].loss);
  const ctx = document.getElementById('heroChart').getContext('2d');
  if(heroChart) heroChart.destroy();
  heroChart = new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Победы', data:wins},{label:'Поражения', data:loss}]},
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });
}
function renderPlayerChart(dataObj){
  const labels = Object.keys(dataObj);
  const wins = labels.map(l=>dataObj[l].win);
  const loss = labels.map(l=>dataObj[l].loss);
  const ctx = document.getElementById('playerChart').getContext('2d');
  if(playerChart) playerChart.destroy();
  playerChart = new Chart(ctx, {
    type:'bar',
    data:{labels, datasets:[{label:'Победы', data:wins},{label:'Поражения', data:loss}]},
    options:{responsive:true, scales:{y:{beginAtZero:true}}}
  });
}

// update view
function updateAll(){
  const filterMap = $('filterMap').value;
  const filterHero = $('filterHero').value;
  const hStats = calcHeroStats(filterMap, filterHero);
  const pStats = calcPlayerStats(filterMap, filterHero);
  renderHeroChart(hStats);
  renderPlayerChart(pStats);
}

// events
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadStatic();
  loadLocal();
  updateAll();

  $('addMatchBtn').addEventListener('click', addMatch);
  $('resetBtn').addEventListener('click', resetAll);
  $('filterMap').addEventListener('change', updateAll);
  $('filterHero').addEventListener('change', updateAll);
});
