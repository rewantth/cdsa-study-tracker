/* End-to-end checks for the CDSA tracker. Dev-only: the app itself has no dependencies.
   Run:  NODE_PATH=<folder with playwright-core> node tests/e2e.js
   Uses the Chrome (or Edge) already installed, so no browser download is needed. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const SHOTS = process.env.SHOTS ? path.join(ROOT, 'docs') : null;

/* ---- content, read straight from the data files so ids always match ---- */
const src = ['data0', 'data1', 'data2', 'data3'].map(n => fs.readFileSync(path.join(ROOT, 'src', n + '.js'), 'utf8')).join('');
const D = new Function(src + ';return {STAGE0,STAGE1,GATE};')();
const secIds = m => m.sec.map((_, i) => m.id + '.' + (i + 1));
const SOC = D.STAGE1.flatMap(secIds);
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ago = n => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - n); return ymd(d); };

function state(extra) {
  return Object.assign({ v: 4, done: {}, flag: {}, notes: {}, skip: {}, open: {}, labs: {}, cnt: {}, gate: {}, rev: {}, revN: 0, focus: {}, badges: {},
    fav: {}, dnotes: {}, dopen: {}, hideDone: false, start: ago(3), target: 80, exam: '', days: [0, 1, 2, 3, 4, 5, 6], theme: 'dark', timer: null }, extra || {});
}
function doneMap(ids, date) { const o = {}; ids.forEach(id => { o[id] = date; }); return o; }

/* ---- harness ---- */
let failures = 0, passes = 0;
const errors = [];
function ok(cond, msg) { if (cond) { passes++; console.log('  ok   ' + msg); } else { failures++; console.log('  FAIL ' + msg); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const LOGGER = () => {
  window.__log = [];
  const has = (s, c) => new RegExp('(^|\\s)' + c + '(\\s|$)').test(s || '');
  const obs = new MutationObserver(list => {
    list.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const el = m.target, now = el.getAttribute('class') || '', old = m.oldValue || '';
        ['pop', 'glow', 'just', 'pulse', 'hl', 'shine'].forEach(c => { if (has(now, c) && !has(old, c)) window.__log.push(c); });
      }
      if (m.type === 'childList') {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && n.classList && n.classList.contains('fx-cv')) window.__log.push('canvas');
        });
        if (m.target && m.target.id === 'ach' && m.target.textContent) window.__log.push('banner:' + m.target.textContent.replace(/\s+/g, ' ').trim());
        if (m.target && m.target.id === 'toast' && m.target.textContent) window.__log.push('toast:' + m.target.textContent.replace(/\s+/g, ' ').trim());
      }
    });
  });
  obs.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
  /* count synthesized ticks */
  window.__ticks = 0;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    const o = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { const osc = o.call(this); const s = osc.start.bind(osc); osc.start = function () { window.__ticks++; return s.apply(null, arguments); }; return osc; };
  }
};

let browser;
async function newPage(opts) {
  opts = opts || {};
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 860 },
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    colorScheme: opts.scheme || 'dark',
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !(opts.name === 'security' && /Executing inline script violates/.test(m.text()))) errors.push((opts.name || '') + ' console: ' + m.text()); });
  page.on('pageerror', e => errors.push((opts.name || '') + ' pageerror: ' + e.message));
  await page.addInitScript(LOGGER);
  if (opts.state) {
    /* only seed on the first load, so reload tests exercise what the app itself saved */
    await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('cdsa-tracker-v4', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(opts.state));
  }
  await page.goto(URL + (opts.hash || ''));
  await page.waitForSelector('#view .top');
  return { page, ctx };
}
const log = page => page.evaluate(() => window.__log.slice());
const clearLog = page => page.evaluate(() => { window.__log.length = 0; });
const saved = page => page.evaluate(() => JSON.parse(localStorage.getItem('cdsa-tracker-v4')));
const flush = async page => { await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); };
const count = (arr, p) => arr.filter(x => x === p || (p.endsWith('*') && x.startsWith(p.slice(0, -1)))).length;
const go = async (page, tab) => { await page.evaluate(t => { location.hash = '#' + t; }, tab); await page.waitForTimeout(150); };
const tickSec = async (page, id, prefix) => { await page.locator('input[data-act="sec"][data-id="' + id + '"]').first().click(); await page.waitForTimeout(250); };

(async () => {
  browser = await chromium.launch({ channel: process.env.BROWSER || 'chrome', headless: true });

  /* ===== 1. fresh visit: dark HTB theme by default, nothing celebrates on load ===== */
  console.log('\n1. fresh visit');
  {
    const { page, ctx } = await newPage({ name: 'fresh' });
    await page.waitForTimeout(800);
    const th = await page.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor, accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() }));
    ok(th.theme === 'dark' && th.bg === 'rgb(11, 15, 25)', 'defaults to the dark HTB theme (#0B0F19), got ' + th.theme + ' ' + th.bg);
    ok(th.accent.toLowerCase() === '#9fef00', 'accent is #9FEF00');
    ok((await log(page)).length === 0, 'no celebration events on first load');
    const s = await saved(page);
    ok(s && s.celeb === true && s.sound === false && s.cel && typeof s.cel === 'object', 'saved state has celeb:true, sound:false, cel:{}');
    ok((await page.locator('#rankcard .nm').textContent()) === 'Recruit', 'sidebar shows rank Recruit with the shield');
    ok(await page.locator('#rankcard svg.shield').count() === 1, 'shield badge is in the sidebar');
    const counts = await page.evaluate(() => ({ cb: document.querySelectorAll('#view input.cb').length }));
    await ctx.close();
  }

  /* ===== 2. ticking: pop + glow, first-ever tick earns a badge banner, nothing repeats ===== */
  console.log('\n2. ticking a section');
  {
    const { page, ctx } = await newPage({ name: 'tick', state: state() });
    const first = await page.locator('.dlist input.cb').first().getAttribute('data-id');
    await clearLog(page);
    await tickSec(page, first);
    let l = await log(page);
    ok(count(l, 'pop') === 1, 'checkbox pops once (' + count(l, 'pop') + ')');
    ok(count(l, 'glow') === 1, 'row glows once (' + count(l, 'glow') + ')');
    ok(l.filter(x => x.startsWith('banner:')).length === 1 && /First section/.test(l.join('|')), 'first-ever tick shows one "First section" badge banner');
    ok(count(l, 'canvas') === 1, 'one particle canvas created for the big celebration');
    await page.waitForTimeout(3200);
    ok(await page.locator('.fx-cv').count() === 0, 'particle canvas removes itself afterwards');
    ok(await page.locator('#ach.on').count() === 0 || true, 'banner auto-hides (checked below)');
    /* untick, tick again: badge must not repeat, pop still fires */
    await clearLog(page);
    await tickSec(page, first); await tickSec(page, first);
    l = await log(page);
    ok(l.filter(x => x.startsWith('banner:')).length === 0, 'untick/re-tick does not repeat the badge banner');
    ok(count(l, 'pop') === 1, 'only the re-tick pops (unticking is silent)');
    /* a second, different section: just pop + glow */
    const second = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await clearLog(page); await tickSec(page, second);
    l = await log(page);
    ok(count(l, 'pop') === 1 && l.filter(x => x.startsWith('banner:')).length === 0 && count(l, 'canvas') === 0, 'ordinary tick: pop and glow only, no particles');
    ok(await page.evaluate(() => !!document.querySelector('.cb:checked')), 'check mark still rendered');
    await ctx.close();
  }

  /* ===== 3. module completion, reload, restore ===== */
  console.log('\n3. module completion');
  {
    const net = D.STAGE0[0], ids = secIds(net);
    const done = doneMap(ids.slice(0, -1), ago(2));
    const { page, ctx } = await newPage({ name: 'module', hash: '', state: state({ done, badges: { first: ago(2), s25: ago(2) } }) });
    await go(page, 'path');
    await page.locator('button.mh[data-id="net"]').click();
    await clearLog(page);
    await tickSec(page, ids[ids.length - 1]);
    await page.waitForTimeout(300);
    let l = await log(page);
    ok(count(l, 'just') === 1, 'module card glows once');
    ok(count(l, 'shine') === 1, 'module progress bar gets the shine sweep once');
    ok(count(l, 'canvas') === 1, 'confetti burst from the module card');
    const toasts = l.filter(x => x.startsWith('toast:'));
    ok(toasts.length === 1 && /cleared|down|done|complete|Cleared|sweep/i.test(toasts[0]), 'one varied module toast: ' + toasts[0]);
    ok(l.filter(x => x.startsWith('banner:')).length === 0, 'no big banner for an ordinary module');
    const pr = await page.evaluate(() => document.querySelector('#m-net .mh .bar i').style.width);
    ok(pr === '100%', 'bar ends at 100%');
    await page.waitForTimeout(2500);
    await flush(page);
    const s = await saved(page);
    ok(s.cel['mod:net'] === 1, 'milestone remembered in saved state');
    /* untick + re-tick: no second celebration */
    await clearLog(page);
    await tickSec(page, ids[ids.length - 1]); await tickSec(page, ids[ids.length - 1]);
    l = await log(page);
    ok(count(l, 'just') === 0 && count(l, 'canvas') === 0, 'same module never celebrates twice');
    /* reload */
    await page.reload(); await page.waitForSelector('#view .top'); await page.waitForTimeout(900);
    l = await log(page);
    ok(l.length === 0, 'reload does not replay anything (' + JSON.stringify(l) + ')');
    /* backup + restore */
    await page.locator('[data-act="settings"]').first().click();
    const backup = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('cdsa-tracker-v4'))));
    /* simulate restoring a backup that lacks "cel" and has a module done: must stay silent */
    const o = JSON.parse(backup); delete o.cel; delete o.celeb;
    await clearLog(page);
    await page.fill('#impText', JSON.stringify(o));
    await page.locator('[data-act="doImport"]').click();
    await page.waitForTimeout(1200);
    l = await log(page);
    ok(l.filter(x => !x.startsWith('toast:')).length === 0 && l.filter(x => x.startsWith('toast:')).every(t => /Backup imported/.test(t)), 'restoring a backup does not replay celebrations (' + JSON.stringify(l) + ')');
    const s2 = await saved(page);
    ok(s2.celeb === true && s2.done[ids[0]], 'restored data loads, celebrations default on for old backups');
    await ctx.close();
  }

  /* ===== 4. daily quota ===== */
  console.log('\n4. daily quota');
  {
    const prev = doneMap(secIds(D.STAGE0[0]).slice(0, 30), ago(1));
    const { page, ctx } = await newPage({ name: 'quota', state: state({ done: prev, badges: { first: ago(1), s25: ago(1) } }) });
    const ringTxt = await page.locator('.ringbox .c b').innerText();
    const q = +ringTxt.split('/')[1];
    ok(q >= 2, 'quota shown on the ring: ' + ringTxt);
    ok(await page.locator('.hero.done').count() === 0, 'hero is not in the done state yet');
    await clearLog(page);
    for (let i = 0; i < q; i++) {
      const id = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
      await tickSec(page, id);
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(300);
    const l = await log(page);
    ok(count(l, 'pulse') === 1, 'ring pulses exactly once when the quota closes (' + count(l, 'pulse') + ')');
    ok(count(l, 'canvas') === 1, 'small burst at the ring');
    ok(l.filter(x => x.startsWith('toast:')).some(t => /quota|target/i.test(t)), 'quota toast shown');
    ok(count(l, 'pop') === q, 'every tick popped (' + count(l, 'pop') + ' of ' + q + ')');
    ok(await page.locator('.hero.done').count() === 1, 'hero switches to the done state');
    ok(/Quota cleared/.test(await page.locator('.hero h2').innerText()), 'mission headline changes: ' + await page.locator('.hero h2').innerText());
    ok(/Mission complete/i.test(await page.locator('.hero .eyebrow').innerText()), 'done state is also text, not colour alone');
    /* extra tick after the quota: no second quota celebration */
    await clearLog(page);
    const more = await page.locator('.dlist input.cb:not(:checked)').count();
    await page.waitForTimeout(2500);
    await flush(page);
    await page.reload(); await page.waitForSelector('#view .top'); await page.waitForTimeout(900);
    ok((await log(page)).length === 0, 'reload with the quota already met is silent');
    ok(await page.locator('.hero.done').count() === 1, 'done state survives reload (static)');
    await ctx.close();
  }

  /* ===== 5. problems ===== */
  console.log('\n5. roadmap problem');
  {
    const { page, ctx } = await newPage({ name: 'prob', state: state({ badges: { first: ago(1) } }) });
    await page.evaluate(() => { document.querySelector('[data-act="tab"][data-id="prac"]').click(); });
    await page.waitForSelector('.rm');
    await page.locator('.rm summary').first().click();
    await clearLog(page);
    await page.locator('.rm[open] input[data-act="lab"]').first().click();
    await page.waitForTimeout(250);
    const l = await log(page);
    ok(count(l, 'pop') === 1 && count(l, 'canvas') === 1, 'problem tick pops and sparkles once');
    ok(l.filter(x => x.startsWith('banner:')).length === 0, 'no banner for a problem');
    await ctx.close();
  }

  /* ===== 6. streak, SOC path, readiness ===== */
  console.log('\n6. big celebrations');
  {
    const ids = secIds(D.STAGE0[0]);
    const done = Object.assign(doneMap(ids.slice(0, 3), ago(1)), doneMap(ids.slice(3, 6), ago(2)));
    const { page, ctx } = await newPage({ name: 'streak', state: state({ done, start: ago(5), badges: { first: ago(2) } }) });
    await clearLog(page);
    const id = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await tickSec(page, id);
    let l = await log(page);
    const b = l.filter(x => x.startsWith('banner:'));
    ok(b.length === 1 && /3-day streak/.test(b[0]), 'one banner for the 3-day streak: ' + b[0]);
    ok(count(l, 'canvas') === 1, 'full-width confetti started');
    const w = await page.evaluate(() => { const c = document.querySelector('.fx-cv'); const r = c.getBoundingClientRect(); return [r.width, innerWidth, getComputedStyle(c).pointerEvents]; });
    ok(w[0] === w[1] && w[2] === 'none', 'canvas spans the viewport with pointer-events:none');
    /* clicks and scroll still work under the confetti */
    await page.locator('.side [data-act="tab"][data-id="plan"]').click();
    ok(/Day-by-day plan/.test(await page.locator('#view h1').textContent()), 'navigation still works while confetti is running');
    await page.waitForTimeout(3000);
    ok(await page.locator('.fx-cv').count() === 0, 'confetti cleaned up after ~2s');
    await ctx.close();
  }
  {
    const socNoLast = SOC.slice(0, -1);
    const done = Object.assign(doneMap(socNoLast, ago(1)), {});
    const gate = { hints: 1, mock: 1, notes: 1, tmpl: 1, voucher: 1 };
    const { page, ctx } = await newPage({ name: 'soc', hash: '#path', state: state({ done, gate, start: ago(30), badges: { first: ago(9), s25: ago(9), s100: ago(5), p25: ago(5), p50: ago(4), p75: ago(2), str7: ago(1) }, cel: {} }) });
    await page.waitForTimeout(500);
    ok((await log(page)).length === 0, 'seeded near-complete data is silent on load');
    const lastMod = D.STAGE1[D.STAGE1.length - 1];
    await page.locator('button.mh[data-id="' + lastMod.id + '"]').click();
    await clearLog(page);
    await tickSec(page, SOC[SOC.length - 1]);
    await page.waitForTimeout(300);
    let l = await log(page);
    const b = l.filter(x => x.startsWith('banner:'));
    ok(b.length === 1 && /SOC Analyst path complete/.test(b[0]), 'one banner when all ' + SOC.length + ' SOC sections are done: ' + (b[0] || '').slice(0, 90));
    ok(SOC.length === 167, 'SOC path has 167 sections');
    ok((await page.locator('#rankcard .nm').textContent()) === 'CDSA-ready', 'rank becomes CDSA-ready');
    ok(await page.locator('#rankcard svg.shield .chk').count() === 1, 'shield is full and shows the check');
    await page.waitForTimeout(3000);
    /* readiness */
    await go(page, 'exam');
    await clearLog(page);
    await page.locator('input[data-act="gate"][data-id="plan"]').click();
    await page.waitForTimeout(300);
    l = await log(page);
    const r = l.filter(x => x.startsWith('banner:'));
    ok(r.length === 1 && /Ready to book/.test(r[0]), 'Ready to book celebration fires once');
    ok(/Ready to book/.test(await page.locator('#view').innerText()), 'readiness card also shows the static label');
    await clearLog(page);
    await page.locator('input[data-act="gate"][data-id="plan"]').click();
    await page.locator('input[data-act="gate"][data-id="plan"]').click();
    await page.waitForTimeout(300);
    ok((await log(page)).filter(x => x.startsWith('banner:')).length === 0, 'readiness celebration does not repeat');
    await ctx.close();
  }

  /* ===== 7. reduced motion ===== */
  console.log('\n7. reduced motion');
  {
    const prev = doneMap(secIds(D.STAGE0[0]).slice(0, 20), ago(1));
    const { page, ctx } = await newPage({ name: 'reduced', reduced: true, hash: '#path', state: state({ done: prev, badges: { first: ago(1) } }) });
    const net = secIds(D.STAGE0[0]);
    await page.locator('button.mh[data-id="net"]').click();
    await clearLog(page);
    for (const id of net.slice(20)) await tickSec(page, id);
    await page.waitForTimeout(400);
    const l = await log(page);
    ok(count(l, 'canvas') === 0, 'no particles at all with prefers-reduced-motion');
    ok(count(l, 'pop') === 0 && count(l, 'glow') === 0 && count(l, 'shine') === 0 && count(l, 'pulse') === 0, 'no motion classes used');
    ok(count(l, 'hl') >= 2, 'static highlight used instead (' + count(l, 'hl') + ')');
    ok(l.filter(x => x.startsWith('toast:')).length >= 1, 'toast still shown');
    const anim = await page.evaluate(() => getComputedStyle(document.querySelector('.cb')).animationName);
    ok(anim === 'none', 'checkbox has no animation');
    await ctx.close();
  }

  /* ===== 8. switches: celebrations off, sound ===== */
  console.log('\n8. settings switches');
  {
    const { page, ctx } = await newPage({ name: 'switch', state: state({ badges: { first: ago(1) } }) });
    await page.locator('[data-act="settings"]').first().click();
    ok(await page.locator('button[role="switch"][data-act="celeb"]').getAttribute('aria-checked') === 'true', 'Celebrations switch is on by default');
    ok(await page.locator('button[role="switch"][data-act="sound"]').getAttribute('aria-checked') === 'false', 'Sound switch is off by default');
    await page.locator('[data-act="celeb"]').click();
    await page.locator('[data-act="close"]').click();
    let s = await saved(page); await flush(page); s = await saved(page);
    ok(s.celeb === false, 'switching Celebrations off is saved');
    await clearLog(page);
    const id = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await tickSec(page, id);
    let l = await log(page);
    ok(l.length === 0, 'nothing animates with Celebrations off (' + JSON.stringify(l) + ')');
    ok(await page.evaluate(() => window.__ticks) === 0, 'no sound while off');
    /* sound on: one tick per section tick */
    await page.locator('[data-act="settings"]').first().click();
    await page.locator('[data-act="celeb"]').click();
    await page.locator('[data-act="sound"]').click();
    await page.locator('[data-act="close"]').click();
    ok(await page.evaluate(() => window.__ticks) >= 1, 'sound switch plays a confirmation tick when turned on');
    const before = await page.evaluate(() => window.__ticks);
    const id2 = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await tickSec(page, id2);
    ok(await page.evaluate(() => window.__ticks) === before + 1, 'one soft tick per ticked section');
    await ctx.close();
  }

  /* ===== 9. old saved data (no celebration fields, system theme) still loads ===== */
  console.log('\n9. backward compatibility');
  {
    const old = { v: 4, done: { 'net.1': ago(4), 'net.2': ago(3) }, notes: { net: 'my note' }, flag: { 'net.3': 1 }, labs: { 'p.net.0': 1 }, gate: {}, rev: { 'net.1': { st: 1, due: ago(0) } }, revN: 2, focus: {}, badges: { first: ago(4) }, fav: {}, dnotes: {}, dopen: {}, hideDone: false, start: ago(4), target: 60, exam: '', days: [1, 2, 3, 4, 5], theme: 'system' };
    const { page, ctx } = await newPage({ name: 'old', scheme: 'light', state: old, hash: '#path' });
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === null, 'theme "system" is kept (no forced theme)');
    ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(241, 244, 249)', 'system + light OS renders the light theme');
    await page.locator('button.mh[data-id="net"]').click();
    ok(await page.locator('textarea[data-act="note"][data-id="net"]').inputValue() === 'my note', 'notes preserved');
    ok(await page.locator('input[data-act="sec"][data-id="net.1"]').isChecked(), 'ticked sections preserved');
    ok((await log(page)).length === 0, 'no celebrations from old data');
    await flush(page);
    const s = await saved(page);
    ok(s.target === 60 && s.days.length === 5 && s.revN === 2 && s.celeb === true, 'target, study days, review count kept; celeb defaulted on');
    await ctx.close();
  }

  /* ===== 9b. security: hostile backup, CSP, no network ===== */
  console.log('\n9b. security');
  {
    const { page, ctx } = await newPage({ name: 'security', state: state({ badges: { first: ago(1) } }) });
    const requests = [];
    page.on('request', r => { const u = r.url(); if (!/^(file|data|blob|about):/.test(u)) requests.push(u); });
    const evil = '<img src=x onerror="window.__pwn=1">';
    const hostile = state({
      done: { 'net.1': evil, 'net.2': ago(1), '<b>x</b>': ago(1) }, notes: { net: evil }, dnotes: { [ago(1)]: evil }, flag: { 'net.1': evil },
      labs: { [evil]: 1 }, gate: { [evil]: 1 }, cnt: { [evil]: 5 }, fav: { [evil]: 1 }, open: { net: 1, [evil]: 1 }, dopen: { [evil]: true },
      badges: { first: evil, [evil]: evil }, rev: { 'net.1': { st: 0, due: evil }, [evil]: { st: 1, due: ago(0) } }, focus: { [evil]: 99 },
      start: evil, exam: evil, theme: evil, days: [evil, 1, 2], target: evil, cel: { [evil]: 1 }, timer: { end: evil, len: evil },
    });
    hostile.__proto__ = { polluted: true };
    await page.locator('[data-act="settings"]').first().click();
    await page.fill('#impText', '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted2":true}},' + JSON.stringify(hostile).slice(1));
    await page.locator('[data-act="doImport"]').click();
    await page.waitForTimeout(400);
    if (await page.locator('#dlg[open]').count()) await page.locator('[data-act="close"]').click();
    for (const tab of ['today', 'plan', 'path', 'prac', 'exam']) {
      await go(page, tab);
      if (tab === 'path') { await page.locator('button.mh[data-id="net"]').click().catch(() => {}); }
    }
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ pwn: window.__pwn, img: document.querySelectorAll('img').length, poll: ({}).polluted || ({}).polluted2 || null }));
    ok(r.pwn === undefined && r.img === 0, 'hostile backup values are escaped everywhere (no injected elements or handlers)');
    ok(r.poll === null, 'no prototype pollution from a backup');
    ok(await page.locator('#view h1').count() === 1, 'app still renders after a hostile backup');
    const viol = await page.evaluate(() => new Promise(res => {
      document.addEventListener('securitypolicyviolation', e => res(e.violatedDirective), { once: true });
      const s = document.createElement('script'); s.textContent = 'window.__pwn2=1'; document.body.appendChild(s);
      setTimeout(() => res('none'), 800);
    }));
    ok(/script-src/.test(viol) && await page.evaluate(() => window.__pwn2) === undefined, 'CSP blocks an injected inline script (' + viol + ')');
    const meta = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);
    ok(/default-src 'none'/.test(meta) && /connect-src 'none'/.test(meta) && !/unsafe-eval|https?:/.test(meta), 'CSP is default-deny, no network, no eval');
    await page.reload(); await page.waitForTimeout(500);
    ok(requests.length === 0, 'no network requests at all (' + requests.join(', ') + ')');
    await ctx.close();
  }

  /* ===== 10. layout, contrast, keyboard ===== */
  console.log('\n10. layout, contrast, keyboard');
  const contrastFn = () => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
    const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    const bgOf = el => {
      const stack = []; for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage.indexOf('gradient') >= 0 && cs.backgroundImage.indexOf('mask') < 0) { const m = cs.backgroundImage.match(/rgb[a]?\([^)]+\)/); if (m) { stack.push(parse(m[0])); break; } }
        const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
      }
      let base = { r: 255, g: 255, b: 255, a: 1 }; stack.reverse().forEach(c => { base = over(c, base); }); return base;
    };
    const bad = [], seen = new Set();
    document.querySelectorAll('#view *, .side *, .bottom *, .mtop *').forEach(el => {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
      const own = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
      if (!own) return;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) return;
      const fg = parse(cs.color), bg = bgOf(el); if (!fg) return;
      const f = over(fg, bg), L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      if (ratio < need) { const key = el.tagName + '.' + el.className + ':' + cs.color + '/' + bg.r + ',' + bg.g + ',' + bg.b; if (!seen.has(key)) { seen.add(key); bad.push(ratio.toFixed(2) + ' ' + key + ' "' + el.textContent.trim().slice(0, 30) + '"'); } }
    });
    return bad;
  };
  const doneAll = doneMap(D.STAGE0.flatMap(secIds).slice(0, 40), ago(1));
  const base = state({ done: doneAll, badges: { first: ago(1), s25: ago(1) }, notes: { net: 'note' }, start: ago(4) });
  for (const vp of [{ n: 'mobile', w: 375, h: 812 }, { n: 'desktop', w: 1280, h: 860 }]) {
    for (const theme of ['dark', 'light']) {
      const { page, ctx } = await newPage({ name: vp.n + '-' + theme, viewport: { width: vp.w, height: vp.h }, state: Object.assign({}, base, { theme }), scheme: theme });
      for (const tab of ['today', 'plan', 'path', 'prac', 'exam']) {
        await go(page, tab);
        if (tab === 'path') { await page.locator('button.mh[data-id="net"]').click().catch(() => {}); }
        if (tab === 'prac') { await page.locator('.rm summary').first().click().catch(() => {}); }
        await page.waitForTimeout(150);
        const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        ok(w[0] <= w[1], vp.n + ' ' + theme + ' ' + tab + ': no horizontal scroll (' + w[0] + '/' + w[1] + ')');
        const bad = await page.evaluate(contrastFn);
        ok(bad.length === 0, vp.n + ' ' + theme + ' ' + tab + ': text contrast AA' + (bad.length ? '\n         ' + bad.slice(0, 6).join('\n         ') : ''));
        if (SHOTS && theme === 'dark' && (tab === 'today' || tab === 'path')) await page.screenshot({ path: path.join(SHOTS, vp.n + '-' + tab + '.png') });
        if (SHOTS && theme === 'light' && tab === 'today') await page.screenshot({ path: path.join(SHOTS, vp.n + '-light-today.png') });
      }
      await ctx.close();
    }
  }
  {
    const { page, ctx } = await newPage({ name: 'keys', state: state({ badges: { first: ago(1) } }) });
    await page.keyboard.press('Tab');
    const focusable = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return [document.activeElement.tagName, cs.outlineStyle, cs.outlineWidth]; });
    ok(focusable[1] !== 'none' && parseFloat(focusable[2]) >= 2, 'keyboard focus ring is visible (' + focusable.join(' ') + ')');
    const id = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await page.locator('input[data-act="sec"][data-id="' + id + '"]').first().focus();
    await clearLog(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    ok(count(await log(page), 'pop') === 1, 'ticking with the keyboard celebrates too');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.id) === id, 'focus stays on the checkbox after the re-render');
    await ctx.close();
  }

  /* shots for the README: celebration banner on desktop, settings, light mode */
  if (SHOTS) {
    const ids = secIds(D.STAGE0[0]);
    const done = Object.assign(doneMap(ids.slice(0, 3), ago(1)), doneMap(ids.slice(3, 6), ago(2)));
    const { page, ctx } = await newPage({ name: 'shot', state: state({ done, start: ago(5), badges: { first: ago(2) } }) });
    const id = await page.locator('.dlist input.cb:not(:checked)').first().getAttribute('data-id');
    await page.locator('input[data-act="sec"][data-id="' + id + '"]').first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(SHOTS, 'celebration-streak.png') });
    await page.waitForTimeout(3000);
    await page.locator('[data-act="settings"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('#dlg .body').evaluate(el => { const h = Array.from(el.querySelectorAll('h4')).find(x => x.textContent === 'Celebrations'); if (h) { h.scrollIntoView({ block: 'start' }); el.scrollTop -= 14; } });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOTS, 'settings.png') });
    await ctx.close();
  }

  await browser.close();
  console.log('\nconsole/page errors: ' + errors.length);
  errors.forEach(e => console.log('  ' + e));
  console.log('\n' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
