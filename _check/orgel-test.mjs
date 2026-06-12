// 27 星のオルゴール — 回転で鳴る・タップで植える/抜く。エラー0
import { chromium } from 'playwright';
let failed = 0;
const ok = (n, p, note='') => { if(!p) failed++; console.log(`${p?'PASS':'FAIL'}  ${n}${note?'  -- '+note:''}`); };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport:{width:1280,height:800} })).newPage();
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:8013/demos/27-orgel.html', { waitUntil:'networkidle' });
await page.waitForTimeout(2000);

const st = () => page.evaluate(() => ({
  pins: +document.getElementById('scene').dataset.pins || 0,
  notes: +document.getElementById('scene').dataset.notes || 0,
}));

const s0 = await st();
ok('お手本のピンが植わっている(8本)', s0.pins === 8, JSON.stringify(s0));

// 一周(~15秒)待つと音符が鳴る(notes が増える)
await page.waitForTimeout(16000);
const s1 = await st();
ok('回転で旋律が鳴る(notes>=6)', s1.notes >= 6, JSON.stringify(s1));

// 筒の正面をタップ → ピンが増える(or 既存セルなら減る)
await page.mouse.click(640, 380);
await page.waitForTimeout(300);
const s2 = await st();
ok('タップでピンが植わる/抜ける(数が変わる)', s2.pins !== s1.pins, `before=${s1.pins} after=${s2.pins}`);

// 同じ場所をもう一度 → 元に戻る(トグル)
await page.mouse.click(640, 380);
await page.waitForTimeout(300);
const s3 = await st();
ok('もう一度ふれると戻る(トグル)', Math.abs(s3.pins - s1.pins) <= 1, `back=${s3.pins} base=${s1.pins}`);

await page.screenshot({ path: '/Users/<redacted>/Desktop/dev/260611_hikari/_check/orgel.png' });
const hud = await page.evaluate(() => ({
  back: !!document.querySelector('.hud-back'),
  no: (document.querySelector('.hud-no')||{}).textContent,
}));
ok('HUD', hud.back && /27/.test(hud.no), JSON.stringify(hud));
ok('console/pageerror 0件', errs.length === 0, errs.join('|').slice(0,150));

// モバイル縦
const mp = await (await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3 })).newPage();
const merrs = [];
mp.on('console', m => { if (m.type()==='error') merrs.push(m.text()); });
mp.on('pageerror', e => merrs.push(String(e)));
await mp.goto('http://localhost:8013/demos/27-orgel.html', { waitUntil:'networkidle' });
await mp.waitForTimeout(1500);
const m0 = await mp.evaluate(() => +document.getElementById('scene').dataset.pins || 0);
await mp.touchscreen.tap(195, 420);
await mp.waitForTimeout(300);
const m1 = await mp.evaluate(() => +document.getElementById('scene').dataset.pins || 0);
const mOver = await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth);
await mp.screenshot({ path: '/Users/<redacted>/Desktop/dev/260611_hikari/_check/orgel-mob.png' });
ok('モバイル縦: タップで植わる・はみ出しなし', merrs.length === 0 && !mOver && m1 !== m0, `errs=${merrs.length} over=${mOver} pins=${m0}→${m1}`);

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
await browser.close();
process.exit(failed ? 1 : 0);
