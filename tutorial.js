/**
 * BUSCA-RITMES · Tutorial Interactiu
 * Sistema de guia pas a pas amb spotlight i demos visuals
 */

'use strict';

const T_SVG = {
  n1: `<svg viewBox="0 0 18 32" width="14" height="24" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="currentColor"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  n2: `<svg viewBox="0 0 18 32" width="14" height="24" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  n3: `<svg viewBox="0 0 25 32" width="17" height="24" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="21.5" cy="23.5" r="2.8" fill="currentColor"/></svg>`,
  n4: `<svg viewBox="0 0 22 16" width="18" height="13" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="8" rx="9.5" ry="6.5" transform="rotate(-8 11 8)" fill="none" stroke="currentColor" stroke-width="3.2"/></svg>`,
  mine: `<svg viewBox="0 0 22 22" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="7" x2="19" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"/><rect x="4" y="7" width="14" height="9" rx="1.5" fill="currentColor"/></svg>`
};

const STEPS = [
  {
    title: 'Benvingut, Director!',
    body: `En un tauler amaguen <strong>${MINES} Silencis</strong>. El teu objectiu: revelar totes les caselles segures sense tocar-ne cap. Un repte de lògica musical!`,
    target: null,
    demo: demoIntro
  },
  {
    title: 'El Tauler de Joc',
    body: `Totes les caselles comencen <strong>amagades</strong>. Fes <strong>clic esquerre</strong> sobre una casella per revelar-la. Si el voltant és buit, s'expandeix automàticament.`,
    target: '#board',
    demo: demoBoard
  },
  {
    title: 'Les Figures Rítmiques',
    body: `En comptes de números, veus <strong>figures rítmiques</strong> que indiquen quants Silencis hi ha als 8 veïns:
      <ul>
        <li>Negra = 1 Silenci</li>
        <li>Blanca = 2 Silencis</li>
        <li>Blanca amb punt = 3 Silencis</li>
        <li>Rodona = 4 Silencis</li>
      </ul>`,
    target: '#legend',
    demo: demoFigures
  },
  {
    title: 'La Batuta 🪄 (Clic Dret)',
    body: `Creus que una casella amaga un Silenci? Fes <strong>clic dret</strong> per marcar-la amb la Batuta 🪄. El comptador s'actualitza. Clic dret de nou per treure-la.`,
    target: '#hud',
    demo: demoFlag
  },
  {
    title: 'Expansió Automàtica',
    body: `Si una casella no té cap Silenci al voltant, el joc <strong>obre automàticament</strong> tot el bloc buit veí. Busca les zones obertes per avançar ràpid!`,
    target: '#board',
    demo: demoFlood
  },
  {
    title: '¡Endavant!',
    body: `🎉 <strong>Victòria:</strong> reveles totes les caselles segures.<br>
    ${T_SVG.mine} <strong>Derrota:</strong> fas clic sobre un Silenci.<br><br>
    La primera casella mai serà un Silenci. Prem <strong>R</strong> per reiniciar.`,
    target: null,
    demo: demoEnd,
    isLast: true
  }
];

let step       = 0;
let hlElement  = null;

const $overlay = document.getElementById('tut-overlay');
const $card    = document.getElementById('tut-card');
const $dots    = document.getElementById('tut-dots');
const $title   = document.getElementById('tut-title');
const $body    = document.getElementById('tut-body');
const $demo    = document.getElementById('tut-demo');
const $prev    = document.getElementById('tut-prev');
const $skip    = document.getElementById('tut-skip');
const $next    = document.getElementById('tut-next');

function launchTutorial() {
  step = 0;
  $overlay.classList.remove('hidden');
  $card.classList.remove('hidden');
  buildDots();
  render(0);
}

const FROM_LANDING = !!new URLSearchParams(location.search).get('tutorial');

function closeTutorial() {
  removeHL();
  $overlay.classList.add('hidden');
  $card.classList.add('hidden');
  if (FROM_LANDING) location.href = 'index.html';
}

function render(i) {
  const s = STEPS[i];

  document.querySelectorAll('.tut-dot').forEach((d, j) => {
    d.className = 'tut-dot' + (j === i ? ' active' : j < i ? ' done' : '');
  });

  $title.textContent = s.title;
  $body.innerHTML    = s.body;

  $demo.innerHTML = '';
  s.demo?.($demo);

  removeHL();
  if (s.target) {
    const el = document.querySelector(s.target);
    if (el) { el.classList.add('tut-hl'); hlElement = el; }
  }

  $prev.style.visibility = i === 0 ? 'hidden' : 'visible';
  $next.textContent = s.isLast ? '¡Anem a jugar! ▶' : 'Següent →';
  $next.style.background = s.isLast
    ? 'linear-gradient(135deg,#28c87a,#1a8a55)'
    : 'linear-gradient(135deg,#6650f0,#3d8ef0)';
}

function removeHL() {
  hlElement?.classList.remove('tut-hl');
  hlElement = null;
}

function buildDots() {
  $dots.innerHTML = STEPS.map(() => '<div class="tut-dot"></div>').join('');
}

$next.addEventListener('click', () => {
  if (STEPS[step].isLast) { closeTutorial(); return; }
  render(++step);
});
$prev.addEventListener('click',  () => { if (step > 0) render(--step); });
$skip.addEventListener('click',  closeTutorial);
$overlay.addEventListener('click', closeTutorial);
$card.addEventListener('click', e => e.stopPropagation());

// ─── Funcions de demo ─────────────────────────────────────
function dc(cls, html, label) {
  const d = document.createElement('div');
  d.className = `tut-demo-cell ${cls}`;
  d.innerHTML = html;
  if (label) {
    const l = document.createElement('div');
    l.className = 'note-label'; l.textContent = label;
    d.appendChild(l);
  }
  return d;
}
function sep(txt) {
  const s = document.createElement('span');
  s.textContent = txt;
  s.style.cssText = 'color:#50507a;font-size:.9rem;align-self:center';
  return s;
}

function demoIntro(el) {
  const h = dc('tut-dc-hidden pulse', '?');
  h.style.color = '#50507a'; h.style.fontSize = '1.3rem';
  const safe = dc('tut-dc-note', '<span style="color:#28c87a;font-size:1.1rem">✓</span>');
  const mine = dc('tut-dc-mine', T_SVG.mine);
  el.append(h, sep('→'), safe, sep('o'), mine);
}

function demoBoard(el) {
  const g = document.createElement('div');
  g.style.cssText = 'display:grid;grid-template-columns:repeat(3,46px);gap:3px';
  [
    ['tut-dc-hidden',''], ['tut-dc-hidden pulse',''], ['tut-dc-hidden',''],
    ['tut-dc-hidden',''], ['tut-dc-note l2',T_SVG.n2], ['tut-dc-hidden',''],
    ['tut-dc-hidden',''], ['tut-dc-hidden',''], ['tut-dc-hidden',''],
  ].forEach(([cls,html]) => {
    const c = document.createElement('div');
    c.className = `tut-demo-cell ${cls}`;
    c.style.cssText = 'width:46px;height:46px'; c.innerHTML = html;
    g.appendChild(c);
  });
  el.appendChild(g);
}

function demoFigures(el) {
  [
    {cls:'tut-dc-note l1', svg:T_SVG.n1, lbl:'Negra = 1'},
    {cls:'tut-dc-note l2', svg:T_SVG.n2, lbl:'Blanca = 2'},
    {cls:'tut-dc-note l3', svg:T_SVG.n3, lbl:'Bl.Punt = 3'},
    {cls:'tut-dc-note l4', svg:T_SVG.n4, lbl:'Rodona = 4'},
  ].forEach(({cls,svg,lbl}) => el.appendChild(dc(cls, svg, lbl)));
}

function demoFlag(el) {
  const h = dc('tut-dc-hidden', '');
  const f = dc('tut-dc-flag',   '🪄');
  el.append(h, sep('→ Clic dret →'), f);
  let s = false;
  setInterval(() => {
    s = !s;
    h.style.opacity = s ? '.3' : '1';
    f.style.opacity = s ? '1'  : '.3';
  }, 1300);
}

function demoFlood(el) {
  const g = document.createElement('div');
  g.style.cssText = 'display:grid;grid-template-columns:repeat(5,36px);gap:2px';
  [
    ['tut-dc-empty',''], ['tut-dc-empty',''], ['tut-dc-note l1',T_SVG.n1], ['tut-dc-hidden',''], ['tut-dc-hidden',''],
    ['tut-dc-empty',''], ['tut-dc-empty',''], ['tut-dc-note l2',T_SVG.n2], ['tut-dc-hidden',''], ['tut-dc-hidden',''],
    ['tut-dc-note l1',T_SVG.n1],['tut-dc-note l1',T_SVG.n1],['tut-dc-note l3',T_SVG.n3],['tut-dc-hidden',''],['tut-dc-hidden',''],
  ].forEach(([cls,html]) => {
    const c = document.createElement('div');
    c.className = `tut-demo-cell ${cls}`;
    c.style.cssText = 'width:36px;height:36px'; c.innerHTML = html;
    g.appendChild(c);
  });
  el.appendChild(g);
}

function demoEnd(el) {
  const wBox = document.createElement('div');
  wBox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
  wBox.appendChild(dc('tut-dc-note','<span style="font-size:1.3rem">🎉</span>'));
  const wl = document.createElement('p');
  wl.textContent = 'Victòria';
  wl.style.cssText = 'font-size:.68rem;color:#28c87a'; wBox.appendChild(wl);

  const lBox = document.createElement('div');
  lBox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
  lBox.appendChild(dc('tut-dc-mine', T_SVG.mine));
  const ll = document.createElement('p');
  ll.textContent = 'Derrota';
  ll.style.cssText = 'font-size:.68rem;color:#ff4444'; lBox.appendChild(ll);

  el.append(wBox, sep('vs'), lBox);
}

// ─── Auto-inici si ?tutorial=1 ────────────────────────────
if (new URLSearchParams(location.search).get('tutorial')) {
  requestAnimationFrame(() => requestAnimationFrame(launchTutorial));
}

window.launchTutorial = launchTutorial;
