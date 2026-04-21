/**
 * BUSCA-RITMES · Lògica del joc — AAA Edition
 * Nivells dinàmics · Àudio · Staggered reveal · Confetti · Screen shake
 */

'use strict';

// ─── Llegir nivell de la URL ───────────────────────────────
const urlLevel = parseInt(new URLSearchParams(location.search).get('level') ?? '2');
const LVL = LEVELS[Math.max(0, Math.min(urlLevel, LEVELS.length - 1))];

const ROWS    = LVL.rows;
const COLS    = LVL.cols;
const MINES   = LVL.mines;
const CELL_PX = LVL.cellPx;
const GAP_PX  = 3;

// ─── SVG figures inline ───────────────────────────────────
const SVG = {
  n1: `<svg viewBox="0 0 18 32" width="18" height="28" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="currentColor"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  n2: `<svg viewBox="0 0 18 32" width="18" height="28" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  n3: `<svg viewBox="0 0 25 32" width="22" height="28" xmlns="http://www.w3.org/2000/svg"><ellipse cx="7" cy="27" rx="6.5" ry="4.5" transform="rotate(-22 7 27)" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="13.2" y1="24.5" x2="13.2" y2="4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="21.5" cy="23.5" r="2.8" fill="currentColor"/></svg>`,
  n4: `<svg viewBox="0 0 22 16" width="22" height="14" xmlns="http://www.w3.org/2000/svg"><ellipse cx="11" cy="8" rx="9.5" ry="6.5" transform="rotate(-8 11 8)" fill="none" stroke="currentColor" stroke-width="3.2"/></svg>`,
  mine: `<svg viewBox="0 0 22 22" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="7" x2="19" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"/><rect x="4" y="7" width="14" height="9" rx="1.5" fill="currentColor"/></svg>`,
  flag: '🪄'
};
const NOTE_SVGS = ['', SVG.n1, SVG.n2, SVG.n3, SVG.n4];
const NOTE_CLS  = ['', 'l1',  'l2',  'l3',  'l4'];

// ─── CSS dinàmic ──────────────────────────────────────────
const root = document.documentElement;
root.style.setProperty('--cell',       `${CELL_PX}px`);
root.style.setProperty('--cols',       COLS);
root.style.setProperty('--rows',       ROWS);
root.style.setProperty('--gap',        `${GAP_PX}px`);
root.style.setProperty('--lvl-accent', LVL.accent);

document.getElementById('level-name').textContent  = `${LVL.name}`;
document.getElementById('level-tempo').textContent = LVL.tempo;
document.title = `Busca-Ritmes · ${LVL.name}`;

// ─── State ────────────────────────────────────────────────
let board      = [];
let phase      = 'idle';
let firstClick = true;
let flags      = 0;
let seconds    = 0;
let timerID    = null;
let pendingTimeouts = []; // cancel·la animacions en reset

// ─── DOM ──────────────────────────────────────────────────
const $board     = document.getElementById('board');
const $minesLeft = document.getElementById('mines-left');
const $timer     = document.getElementById('timer');
const $resetBtn  = document.getElementById('reset-btn');
const $modal     = document.getElementById('modal');
const $modalIcon = document.getElementById('modal-icon');
const $modalTitle= document.getElementById('modal-title');
const $modalMsg  = document.getElementById('modal-msg');
const $modalTime = document.getElementById('modal-time');
const $modalStars= document.getElementById('modal-stars');
const $modalBtn  = document.getElementById('modal-btn');

// ─── Board ────────────────────────────────────────────────
function createBoard() {
  board = Array.from({length: ROWS}, () =>
    Array.from({length: COLS}, () =>
      ({ isMine:false, isRevealed:false, isFlagged:false, adj:0 })
    )
  );
}

function placeMines(safeR, safeC) {
  const safeZone = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeR + dr, nc = safeC + dc;
      if (inBounds(nr, nc)) safeZone.add(nr * COLS + nc);
    }

  let tries = 0;
  while (true) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        board[r][c].isMine = false;

    const pool = [];
    for (let i = 0; i < ROWS * COLS; i++)
      if (!safeZone.has(i)) pool.push(i);

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < MINES; i++)
      board[Math.floor(pool[i] / COLS)][pool[i] % COLS].isMine = true;

    calcAdjacency();
    if (validateMaxFour()) break;
    if (++tries > 5000) break;
  }
}

function calcAdjacency() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!board[r][c].isMine)
        board[r][c].adj = countAdjMines(r, c);
}

function countAdjMines(r, c) {
  let n = 0;
  forEachNeighbour(r, c, (nr, nc) => { if (board[nr][nc].isMine) n++; });
  return n;
}

function validateMaxFour() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!board[r][c].isMine && board[r][c].adj > 4) return false;
  return true;
}

// ─── DOM del tauler ───────────────────────────────────────
function buildDOM() {
  cancelPendingTimeouts();
  $board.innerHTML = '';
  $board.className = '';
  void $board.offsetWidth; // força reflow per reiniciar l'animació
  $board.className = 'board-enter';

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const el = document.createElement('div');
      el.className  = 'cell c-hidden';
      el.dataset.r  = r;
      el.dataset.c  = c;
      el.setAttribute('role', 'gridcell');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click',       onLeftClick);
      el.addEventListener('contextmenu', onRightClick);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') onLeftClick.call(el, e);
        if (e.key === 'f' || e.key === 'F')     onRightClick.call(el, e);
      });
      $board.appendChild(el);
    }
}

function cellEl(r, c) { return $board.children[r * COLS + c]; }

function renderCell(r, c, animate = false) {
  const el   = cellEl(r, c);
  const cell = board[r][c];
  el.className = 'cell';
  el.innerHTML = '';

  if (cell.isFlagged && !cell.isRevealed) {
    el.classList.add('c-flag');
    el.textContent = SVG.flag;
    return;
  }
  if (!cell.isRevealed) {
    el.classList.add('c-hidden');
    return;
  }
  if (cell.isMine) {
    el.classList.add('c-mine');
    el.innerHTML = SVG.mine;
    return;
  }
  if (cell.adj === 0) {
    el.classList.add('c-empty');
    if (animate) forceAnimation(el);
    return;
  }
  el.classList.add('c-note', NOTE_CLS[cell.adj]);
  if (animate) forceAnimation(el);
  el.innerHTML = NOTE_SVGS[cell.adj];
}

function forceAnimation(el) {
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

// ─── Interacció ───────────────────────────────────────────
function onLeftClick(e) {
  e?.preventDefault?.();
  if (phase === 'won' || phase === 'lost') return;
  const r = +this.dataset.r, c = +this.dataset.c;
  const cell = board[r][c];
  if (cell.isFlagged || cell.isRevealed) return;

  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    startTimer();
    phase = 'playing';
    Sounds.start();
  }

  if (cell.isMine) {
    triggerDeath(r, c);
    return;
  }

  const newCells = floodReveal(r, c);
  renderStaggered(newCells, r, c);
  checkWin();
}

function onRightClick(e) {
  e?.preventDefault?.();
  if (phase === 'won' || phase === 'lost') return;
  const r = +this.dataset.r, c = +this.dataset.c;
  const cell = board[r][c];
  if (cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
  flags += cell.isFlagged ? 1 : -1;

  if (cell.isFlagged) Sounds.flag();
  else                Sounds.unflag();

  renderCell(r, c);
  animateCounter($minesLeft, MINES - flags);
}

// ─── Flood fill ───────────────────────────────────────────
function floodReveal(r, c) {
  const revealed = [];
  function flood(r0, c0) {
    const cell = board[r0][c0];
    if (cell.isRevealed || cell.isFlagged || cell.isMine) return;
    cell.isRevealed = true;
    const dist = Math.abs(r0 - r) + Math.abs(c0 - c);
    revealed.push([r0, c0, dist]);
    if (cell.adj === 0)
      forEachNeighbour(r0, c0, (nr, nc) => flood(nr, nc));
  }
  flood(r, c);
  return revealed;
}

/**
 * Revela les caselles amb un efecte d'ona des del centre del clic.
 * Cada capa (distància de Manhattan) apareix amb un petit retard.
 */
function renderStaggered(cells, originR, originC) {
  if (!cells.length) return;

  const maxDist = cells.reduce((m, [,,d]) => Math.max(m, d), 0);
  const stepMs  = maxDist > 0 ? Math.min(35, 200 / maxDist) : 0;

  // Àudio: proporcional a la mida del flood
  if (cells.length === 1) {
    Sounds.revealNote(board[cells[0][0]][cells[0][1]].adj);
  } else {
    Sounds.floodReveal(cells.length);
  }

  cells.forEach(([rr, cc, dist]) => {
    const delay = dist * stepMs;
    if (delay === 0) {
      renderCell(rr, cc, true);
    } else {
      const t = setTimeout(() => renderCell(rr, cc, true), delay);
      pendingTimeouts.push(t);
    }
  });
}

// ─── Mort: drama seqüencial ───────────────────────────────
function triggerDeath(clickR, clickC) {
  stopTimer();
  phase = 'lost';

  Sounds.explode();

  // 1) Treu banderes incorrectes
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell.isFlagged && !cell.isMine) {
        const el = cellEl(r, c);
        el.className = 'cell c-wrong';
        el.textContent = '✗';
      }
    }

  // 2) Mostra la mina clicada immediatament (exploded)
  board[clickR][clickC].isRevealed = true;
  renderCell(clickR, clickC);
  cellEl(clickR, clickC).classList.replace('c-mine', 'c-exploded');

  // 3) Screen shake
  setTimeout(() => {
    $board.classList.add('shake');
    setTimeout(() => $board.classList.remove('shake'), 650);
  }, 50);
  $board.classList.add('state-lost');

  // 4) Revela la resta de mines una a una (dramàtic)
  const otherMines = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c].isMine && !(r === clickR && c === clickC) && !board[r][c].isFlagged)
        otherMines.push([r, c]);

  // Ordena per distància a la mina clicada
  otherMines.sort(([r1,c1], [r2,c2]) => {
    const d1 = Math.abs(r1-clickR) + Math.abs(c1-clickC);
    const d2 = Math.abs(r2-clickR) + Math.abs(c2-clickC);
    return d1 - d2;
  });

  otherMines.forEach(([r, c], i) => {
    const t = setTimeout(() => {
      board[r][c].isRevealed = true;
      renderCell(r, c);
      // Flash a vermell
      const el = cellEl(r, c);
      el.classList.add('mine-pop');
      setTimeout(() => el.classList.remove('mine-pop'), 400);
    }, 120 + i * 70);
    pendingTimeouts.push(t);
  });

  const modalDelay = 150 + otherMines.length * 70 + 700;
  const t = setTimeout(() => showModal(false), modalDelay);
  pendingTimeouts.push(t);
}

// ─── Victòria ─────────────────────────────────────────────
function checkWin() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!board[r][c].isMine && !board[r][c].isRevealed) return;

  stopTimer();
  phase = 'won';
  saveBestTime(LVL.id, seconds);

  Sounds.victory();
  $board.classList.add('state-won');

  // Onada de glow sobre les caselles revelades
  pulseWinCells();

  setTimeout(launchConfetti, 300);
  setTimeout(() => showModal(true), 1600);
}

function pulseWinCells() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isRevealed && !board[r][c].isMine) {
        const el = cellEl(r, c);
        const dist = r + c;
        const t = setTimeout(() => {
          el.classList.add('win-pulse');
          setTimeout(() => el.classList.remove('win-pulse'), 600);
        }, dist * 25);
        pendingTimeouts.push(t);
      }
    }
}

// ─── Confetti ─────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:999';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx2d = canvas.getContext('2d');

  // Origen: centre del tauler
  const rect = $board.getBoundingClientRect();
  const ox = rect.left + rect.width / 2;
  const oy = rect.top  + rect.height / 2;

  const COLORS = ['#d4a017','#3d8ef0','#28c87a','#c0334d','#a028c8','#ffffff','#f5c542'];
  const SHAPES = ['rect', 'circle', 'star'];

  const particles = Array.from({length: 160}, (_, i) => {
    const angle = (Math.random() * 360) * Math.PI / 180;
    const speed = Math.random() * 12 + 4;
    return {
      x: ox + (Math.random() - 0.5) * 40,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 6,
      size: Math.random() * 10 + 4,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      drag: 0.97 + Math.random() * 0.02
    };
  });

  let frame = 0;
  const TOTAL = 200;

  function drawStar(ctx2d, x, y, r) {
    ctx2d.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
      ctx2d[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx2d.closePath();
    ctx2d.fill();
  }

  (function animate() {
    frame++;
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);

    const alpha = frame < TOTAL - 50 ? 1 : 1 - (frame - (TOTAL - 50)) / 50;

    particles.forEach(p => {
      p.x  += p.vx; p.vx *= p.drag;
      p.y  += p.vy; p.vy *= p.drag; p.vy += 0.22;
      p.rot += p.rotV;

      ctx2d.save();
      ctx2d.globalAlpha = alpha * Math.max(0, 1 - p.y / canvas.height);
      ctx2d.translate(p.x, p.y);
      ctx2d.rotate(p.rot * Math.PI / 180);
      ctx2d.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx2d.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
      } else if (p.shape === 'star') {
        drawStar(ctx2d, 0, 0, p.size / 2);
      } else {
        ctx2d.beginPath();
        ctx2d.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.restore();
    });

    if (frame < TOTAL) requestAnimationFrame(animate);
    else canvas.remove();
  })();
}

// ─── Timer ────────────────────────────────────────────────
function startTimer() {
  seconds = 0;
  $timer.textContent = '000';
  clearInterval(timerID);
  timerID = setInterval(() => {
    seconds = Math.min(seconds + 1, 999);
    $timer.textContent = String(seconds).padStart(3, '0');
  }, 1000);
}
function stopTimer() { clearInterval(timerID); timerID = null; }

// ─── Modal ────────────────────────────────────────────────
function showModal(won) {
  if (won) {
    $modalIcon.innerHTML = SVG.n4;
    $modalIcon.style.color = 'var(--n4)';
    $modalTitle.textContent = '¡Victòria!';
    $modalMsg.textContent = `Un compàs perfecte a "${LVL.name}". Has calculat cada figura amb precisió de compositor.`;
    const stars = getStars(LVL.id, seconds);
    $modalStars.innerHTML = Array.from({length:3}, (_,i) =>
      `<span class="star ${i < stars ? 'lit' : ''}">★</span>`
    ).join('');
  } else {
    $modalIcon.innerHTML = SVG.mine;
    $modalIcon.style.color = 'var(--mine)';
    $modalTitle.textContent = 'Game Over!';
    $modalMsg.textContent = 'Has trencat el ritme. Utilitza les figures per calcular on s\'amaguen els silencis.';
    $modalStars.innerHTML = '';
  }
  $modalTime.textContent = `Temps: ${fmtTime(seconds)}`;
  $modal.classList.remove('hidden');
}

// ─── Reset ────────────────────────────────────────────────
function resetGame() {
  cancelPendingTimeouts();
  stopTimer();
  phase = 'idle'; firstClick = true; flags = 0; seconds = 0;
  $timer.textContent     = '000';
  $minesLeft.textContent = String(MINES).padStart(3, '0');
  $modal.classList.add('hidden');
  $board.classList.remove('state-won', 'state-lost', 'shake');
  createBoard();
  buildDOM();
}

// ─── Utils ────────────────────────────────────────────────
function cancelPendingTimeouts() {
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts = [];
}

function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

function forEachNeighbour(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc)) fn(nr, nc);
    }
}

// Anima el canvi del comptador (flash)
function animateCounter(el, val) {
  el.textContent = String(val).padStart(3, '0');
  el.classList.remove('counter-flash');
  void el.offsetWidth;
  el.classList.add('counter-flash');
}

// ─── Wiring ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.key === 'r' || e.key === 'R') && !e.metaKey) resetGame();
});
$resetBtn.addEventListener('click', resetGame);
$modalBtn.addEventListener('click', resetGame);

// Botó de so (mute)
const $muteBtn = document.getElementById('mute-btn');
if ($muteBtn) {
  $muteBtn.addEventListener('click', () => {
    const muted = Sounds.toggle();
    $muteBtn.textContent = muted ? '🔇' : '🔊';
    $muteBtn.title = muted ? 'Activar so' : 'Silenciar';
  });
}

resetGame();
