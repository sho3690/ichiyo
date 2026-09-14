#!/usr/bin/env node
// 今日と明日（日本時間）の頁が無ければ、Claude に書かせて data/essays.json に加える。
//   node scripts/write-tomorrow.mjs              … 今日と明日を確認して、無い分を書く
//   node scripts/write-tomorrow.mjs --date 2026-10-01
//   node scripts/write-tomorrow.mjs --dry-run    … 書くが保存しない（画面に出すだけ）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'essays.json');
const MODEL = process.env.ICHIYO_MODEL || 'claude-opus-5';
// 頁は日本時間で日付が変わった瞬間（0時）に切り替わる
const DAY_START_HOUR = 0;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dateIdx = args.indexOf('--date');
const wanted = dateIdx >= 0 && args[dateIdx + 1] ? [args[dateIdx + 1]] : [jstKey(0), jstKey(1)];

const SEKKI = [[1,5,'小寒'],[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],[3,5,'啓蟄'],[3,20,'春分'],[4,5,'清明'],[4,20,'穀雨'],[5,5,'立夏'],[5,21,'小満'],[6,6,'芒種'],[6,21,'夏至'],[7,7,'小暑'],[7,23,'大暑'],[8,7,'立秋'],[8,23,'処暑'],[9,7,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,23,'霜降'],[11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪'],[12,22,'冬至']];
const WD = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];

function jstKey(offsetDays) {
  const d = new Date(Date.now() - DAY_START_HOUR * 3600000 + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function sekkiOf(m, day) {
  let cur = '冬至';
  for (const [mm, dd, name] of SEKKI) if (m > mm || (m === mm && day >= dd)) cur = name;
  return cur;
}
function describe(key) {
  const [y, m, d] = key.split('-').map(Number);
  const wd = WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { y, m, d, wd, sekki: sekkiOf(m, d) };
}

function buildPrompt(key, past) {
  const t = describe(key);
  const list = past.map(e => `${e.kanji}「${e.title}」`).join('、') || 'なし';
  return [
    'あなたは、新聞一面のコラム（朝日新聞「天声人語」のような形式）を書く名文家です。指定された日の一篇を書いてください。',
    '',
    `【その日】${t.y}年${t.m}月${t.d}日（${t.wd}）。二十四節気は「${t.sekki}」の頃。`,
    `【これまでの頁（漢字「題」）】${list}。主題・切り口・漢字が重ならないようにする。`,
    '',
    '【書き方】',
    '- 本文は450〜550字。4〜5段落。段落は改行ひとつで区切る。段落頭の字下げや空白は入れない。',
    '- 冒頭は、具体的な断片から入る（季節の所作、ある言葉の語源や字義、街や台所の小さな出来事、古典の一節、科学のささやかな事実、暦の行事）。抽象論や一般論から始めない。',
    '- 中盤で視点をひとつずらし、終盤で示唆を残す。結論を断定せず、説教しない。最後の一文は余韻で終える。',
    '- 一文は短く。比喩はひとつまで。感嘆符・疑問符・括弧・引用符は使わない。',
    '- 固有名詞や引用は、実在が確かなものだけ。少しでも不確かなら固有名詞を出さずに書く。作り話を事実のように書かない。時事ニュースには触れない。',
    '- 一人称の小さな出来事（何かを見た、手に取った）は語りの演出として使ってよいが、特定の実在人物との出来事は書かない。',
    '- 敬体（です・ます）ではなく常体（だ・である）で書く。',
    '- 題は2〜8字。詩的だが平易に。',
    '- 本文の核をあらわす漢字一字と、その読み（ひらがな）を添える。',
    '',
    '【出力】次のJSONだけを返す。前置きや説明、コードブロックの記号は書かない。',
    '{"title":"題","kanji":"漢字一字","yomi":"よみ","body":"段落1\\n段落2\\n段落3\\n段落4"}',
  ].join('\n');
}

function askClaude(prompt) {
  const out = execFileSync('claude', ['-p', prompt, '--output-format', 'text', '--model', MODEL], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
    timeout: 10 * 60 * 1000,
  });
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSONが見つかりません: ' + out.slice(0, 200));
  return JSON.parse(out.slice(start, end + 1));
}

function normalize(o, key) {
  if (!o || typeof o !== 'object') throw new Error('形が違います');
  const title = String(o.title || '').trim();
  const kanji = String(o.kanji || '').trim();
  const yomi = String(o.yomi || '').trim();
  const body = String(o.body || '').replace(/\r/g, '').split('\n')
    .map(s => s.replace(/^[\s　]+|[\s　]+$/g, '')).filter(Boolean).join('\n');
  const n = body.replace(/\n/g, '').length;
  if (!title || title.length > 16) throw new Error('題が不正: ' + title);
  if (Array.from(kanji).length !== 1) throw new Error('漢字が一字ではない: ' + kanji);
  if (n < 250 || n > 1000) throw new Error('本文の長さが不正: ' + n + '字');
  return { date: key, title, kanji, yomi, body, source: 'claude', createdAt: new Date().toISOString() };
}

// ---------- 実行 ----------
const essays = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const byDate = new Map(essays.map(e => [e.date, e]));
let changed = false;
let failed = 0;

for (const key of wanted) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) { console.error(`日付の形が違います: ${key}`); failed++; continue; }
  if (byDate.has(key)) { console.log(`${key}: すでに書かれています（${byDate.get(key).kanji}「${byDate.get(key).title}」）`); continue; }
  const past = [...byDate.values()].filter(e => e.date < key).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
  console.log(`${key}: 書いています…`);
  try {
    const doc = normalize(askClaude(buildPrompt(key, past)), key);
    console.log(`${key}: ${doc.kanji}「${doc.title}」 ${doc.body.replace(/\n/g, '').length}字`);
    if (dryRun) { console.log('\n' + doc.body + '\n'); continue; }
    byDate.set(key, doc);
    changed = true;
  } catch (e) {
    console.error(`${key}: 書けませんでした — ${e.message}`);
    failed++;
  }
}

if (changed) {
  const list = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  fs.writeFileSync(FILE, JSON.stringify(list, null, 1) + '\n');
  console.log(`保存しました: ${list.length}頁`);
}
process.exit(failed ? 1 : 0);
