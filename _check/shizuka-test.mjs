// 26 しずかの森 — 静止すると寄ってくる・動くと逃げる。エラー0
import { chromium } from 'playwright';
let failed = 0;
const ok = (n, p, note='') => { if(!p) failed++; console.log(`${p?'PASS':'FAIL'}  ${n}${note?'  -- '+note:''}`); };

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:1280,height:800} })).newPage();
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push(String(e)));
await page.goto('http://localhost:8013/demos/26-shizuka.html', { waitUntil:'networkidle' });
await page.waitForTimeout(1500);

const st = () => page.evaluate(() => ({
  still: +document.getElementById('cv').dataset.still || 0,
  beings: +document.getElementById('cv').dataset.beings || 0,
}));

// 指を置いて静止
await page.mouse.move(640, 400);
await page.waitForTimeout(9000);
const s1 = await st();
ok('静止すると光がなつく(still>8・beings>2)', s1.still > 8 && s1.beings > 2, JSON.stringify(s1));

// さらに待つと増える(蝶の層)
await page.waitForTimeout(8000);
const s2 = await st();
ok('しずけさが深まるほど増える', s2.beings >= s1.beings && s2.still > 16, JSON.stringify(s2));
await page.screenshot({ path: '/Users/<redacted>/Desktop/dev/260611_hikari/_check/shizuka.png' });

// 急に動かすと逃げる
await page.mouse.move(900, 300, { steps: 2 });
await page.waitForTimeout(2500);
const s3 = await st();
ok('うごくと逃げる(beings 減少・still リセット)', s3.beings < s2.beings && s3.still < 4, JSON.stringify(s3));

const hud = await page.evaluate(() => ({
  back: !!document.querySelector('.hud-back'),
  no: (document.querySelector('.hud-no')||{}).textContent,
}));
ok('HUD', hud.back && /26/.test(hud.no), JSON.stringify(hud));
ok('console/pageerror 0件', errs.length === 0, errs.join('|').slice(0,150));

// モバイル縦: 指を置いて静止(touchStart のまま保持)
const mp = await (await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:3 })).newPage();
const merrs = [];
mp.on('console', m => { if (m.type()==='error') merrs.push(m.text()); });
mp.on('pageerror', e => merrs.push(String(e)));
await mp.goto('http://localhost:8013/demos/26-shizuka.html', { waitUntil:'networkidle' });
await mp.waitForTimeout(1000);
const c = await mp.context().newCDPSession(mp);
await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:400}]});
await mp.waitForTimeout(8000);
const m1 = await mp.evaluate(() => ({ still: +document.getElementById('cv').dataset.still || 0, beings: +document.getElementById('cv').dataset.beings || 0 }));
await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
const mOver = await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.body.scrollWidth > innerWidth);
await mp.screenshot({ path: '/Users/<redacted>/Desktop/dev/260611_hikari/_check/shizuka-mob.png' });
ok('モバイル縦: 指を置いた静止で寄ってくる・はみ出しなし', merrs.length === 0 && !mOver && m1.beings > 1 && m1.still > 6, `errs=${merrs.length} over=${mOver} ${JSON.stringify(m1)}`);

console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
await browser.close();
process.exit(failed ? 1 : 0);
