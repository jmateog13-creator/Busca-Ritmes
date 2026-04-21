/**
 * BUSCA-RITMES · Configuració global de nivells
 * Compartit per: levels.html, game.html, tutorial.js
 */

const LEVELS = [
  {
    id: 0, name: 'Largo',      tempo: '♩ = 40',
    rows: 6,  cols: 6,  mines: 4,  cellPx: 68,
    desc: 'Primera nota',
    accent: '#3d8ef0', glow: 'rgba(61,142,240,.45)',
    par: [50, 120]   // [3★, 2★] en segons
  },
  {
    id: 1, name: 'Adagio',     tempo: '♩ = 60',
    rows: 7,  cols: 7,  mines: 7,  cellPx: 60,
    desc: 'Passos segurs',
    accent: '#28c87a', glow: 'rgba(40,200,122,.45)',
    par: [80, 180]
  },
  {
    id: 2, name: 'Andante',    tempo: '♩ = 76',
    rows: 8,  cols: 8,  mines: 10, cellPx: 54,
    desc: 'Temps per pensar',
    accent: '#7ac840', glow: 'rgba(122,200,64,.45)',
    par: [120, 260]
  },
  {
    id: 3, name: 'Moderato',   tempo: '♩ = 100',
    rows: 9,  cols: 9,  mines: 14, cellPx: 50,
    desc: 'Equilibri perfecte',
    accent: '#d4a017', glow: 'rgba(212,160,23,.45)',
    par: [160, 340]
  },
  {
    id: 4, name: 'Allegretto', tempo: '♩ = 116',
    rows: 10, cols: 10, mines: 19, cellPx: 46,
    desc: 'La tensió augmenta',
    accent: '#f0a028', glow: 'rgba(240,160,40,.45)',
    par: [200, 420]
  },
  {
    id: 5, name: 'Allegro',    tempo: '♩ = 132',
    rows: 11, cols: 11, mines: 25, cellPx: 42,
    desc: 'Atenció total',
    accent: '#f06428', glow: 'rgba(240,100,40,.45)',
    par: [260, 540]
  },
  {
    id: 6, name: 'Vivace',     tempo: '♩ = 156',
    rows: 12, cols: 12, mines: 32, cellPx: 38,
    desc: 'Virtuosisme pur',
    accent: '#e03c3c', glow: 'rgba(224,60,60,.45)',
    par: [340, 700]
  },
  {
    id: 7, name: 'Presto',     tempo: '♩ = 184',
    rows: 14, cols: 14, mines: 45, cellPx: 32,
    desc: 'Màster del Silenci',
    accent: '#a028c8', glow: 'rgba(160,40,200,.45)',
    par: [480, 960]
  }
];

function getBestTime(levelId) {
  return parseInt(localStorage.getItem(`br_best_${levelId}`) || '0');
}

function saveBestTime(levelId, seconds) {
  const prev = getBestTime(levelId);
  if (!prev || seconds < prev)
    localStorage.setItem(`br_best_${levelId}`, seconds);
}

function getStars(levelId, seconds) {
  if (!seconds) return 0;
  const [s3, s2] = LEVELS[levelId].par;
  if (seconds <= s3) return 3;
  if (seconds <= s2) return 2;
  return 1;
}

function fmtTime(s) {
  if (!s) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}
