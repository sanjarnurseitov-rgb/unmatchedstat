
// Простая клиентская "база" и логика
// Данные: matches (массив матчей), heroes (справочник), maps (справочник)
// Каждый матч: {mode, hero, players:[], map, result, ts}

// --- helpers ---
const $ = id => document.getElementById(id);

let heroes = [];
let maps = [];
let matches = []; // main dataset
let players = []; // known players list

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

// populate selects and filters
function populateSelects(){
  const heroSel = $('hero');
  const mapSel = $('map');
  const filterMap = $('filterMap');
  const filterHero = $('filterHero');
  heroSel.innerHTML=''; mapSel.innerHTML=''; filterMap.innerHTML='<option value=\"\">Все карты</option>'; filterHero.innerHTML='<option value=\"\">Все герои</option>';

  heroes.forEach(h=>{
    // показываем русское имя, сохраняем английское
    heroSel.insertAdjacentHTML('beforeend', `<option value="${h.name_en}">${h.name_ru}</option>`);
    filterHero.insertAdjacentHTML('beforeend', `<option value="${h.name_en}">${h.name_ru}</option>`);
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
  localStorage.setItem('unmatched_matches_v2', JSON.stringify(matches));
  localStorage.setItem('unmatched_players_v1', JSON.stringify(players));
}
function loadLocal(){
  const raw = localStorage.getItem('unmatched_matches_v2');
  if(raw){ try{ matches = JSON.parse(raw);}catch(e){matches=[]} }
  const pr = localStorage.getItem('unmatched_players_v1');
  if(pr){ try{ players = JSON.parse(pr);}catch(e){players=[]} }
}

// reset data
function resetAll(){
  if(!confirm('Сбросить всю локальную статистику?')) return;
  matches = [];
  players = [];
  saveLocal();
  updateAll();
}

// add match (supports multiple players separated by comma)
function addMatch(){
  const mode = $('mode').value;
  const hero = $('hero').value;
  let playerInput = $('player').value.trim();
  if(!playerInput){ alert('Введите имя игрока'); return; }
  const playersArr = playerInput.split(',').map(s=>s.trim()).filter(Boolean);
  const map = $('map').value;
  const result = $('result').value;

  const match = { mode, hero, players: playersArr, map, result, ts: Date.now() };
  matches.push(match);

  // auto-add players to known list
  playersArr.forEach(p=>{
    if(!players.includes(p)) players.push(p);
  });

  saveLocal();
  updateAll();
  $('player').value='';
}

// players management
function addPlayerFromInput(){
  const name = $('newPlayerName').value.trim();
  if(!name) return alert('Введите имя игрока');
  if(!players.includes(name)) players.push(name);
  $('newPlayerName').value='';
  saveLocal();
  renderPlayers();
}

function renderPlayers(){
  const box = $('playersList');
  box.innerHTML='';
  players.forEach(p=>{
    const card = document.createElement('div');
    card.className='player-card';
    const meta = document.createElement('div');
    meta.className='meta';
    const h = document.createElement('h3');
    h.textContent = p;
    const stats = document.createElement('div');
    stats.className='player-stats';
    const s = calcPlayerSummary(p);
    stats.innerHTML = `Игры: ${s.total} | Победы: ${s.win} | Поражения: ${s.loss} <br> Любимые герои: ${s.topHeroes.join(', ') || '-'} <br> Частые партнёры: ${s.topPartners.join(', ') || '-'}`;
    meta.appendChild(h);
    meta.appendChild(stats);
    card.appendChild(meta);
    box.appendChild(card);
  });
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
    m.players.forEach(pl=>{
      if(!byPlayer[pl]) byPlayer[pl] = {win:0, loss:0, total:0};
      byPlayer[pl][m.result]++;
      byPlayer[pl].total++;
    });
  });
  return byPlayer;
}

function calcPlayerSummary(name){
  const stats = { total:0, win:0, loss:0, heroes:{} , partners: {} };
  matches.forEach(m=>{
    if(m.players.includes(name)){
      stats.total++;
      stats[m.result]++;
      // hero count
      stats.heroes[m.hero] = (stats.heroes[m.hero]||0)+1;
      // partners (other players in same match)
      m.players.forEach(pl=>{
        if(pl!==name){
          stats.partners[pl] = (stats.partners[pl]||0)+1;
        }
      });
    }
  });
  // top heroes and partners
  const topHeroes = Object.entries(stats.heroes).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  const topPartners = Object.entries(stats.partners).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
  return { total: stats.total, win: stats.win, loss: stats.loss, topHeroes, topPartners };
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
  const filterMap = $('filterMap') ? $('filterMap').value : '';
  const filterHero = $('filterHero') ? $('filterHero').value : '';
  const hStats = calcHeroStats(filterMap, filterHero);
  const pStats = calcPlayerStats(filterMap, filterHero);
  renderHeroChart(hStats);
  renderPlayerChart(pStats);
  renderPlayers();
}


// events
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadStatic();
  loadLocal();
  updateAll();

  $('addMatchBtn').addEventListener('click', addMatch);
  $('addPlayerBtn').addEventListener('click', addPlayerFromInput);
  // reset button kept in code if you add it later
  const fMap = $('filterMap');
  if(fMap) fMap.addEventListener('change', updateAll);
  const fHero = $('filterHero');
  if(fHero) fHero.addEventListener('change', updateAll);
});
