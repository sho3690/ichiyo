# 一日一頁

一日一本、およそ五百字の随想を読むだけのページ。
開いた日の頁だけが表示され、次の頁は翌日まで出ない。

**https://sho3690.github.io/ichiyo/**

## しくみ

- `index.html` … ページ本体。`data/essays.json` を読み、日本時間の今日の頁を表示する。右上の「書庫」で過去の頁を一覧できる。
- `data/essays.json` … 頁の本文。1件 = 1日。`date` / `title` / `kanji`（その日の一字） / `yomi` / `body`（段落は改行区切り）。
- `scripts/write-tomorrow.mjs` … 今日と明日の頁が無ければ Claude に書かせて `essays.json` に加える。
- `.github/workflows/daily.yml` … 上のスクリプトを毎日 21:00 と 06:00（日本時間）に走らせ、結果をコミットする。GitHub Pages は `main` ブランチをそのまま配信しているので、コミットが入れば数分でページに反映される。

2026年9月27日までの頁は書き置き済み。それ以降は Actions が毎日書き足す。

## 最初に一度だけ必要な設定

Actions が Claude を使うためのトークンを、この repo の Secrets に登録する。

```sh
# 1. トークンを発行する（ブラウザで Claude にログインすると、sk-ant-oat… で始まる文字列が出る）
claude setup-token

# 2. その文字列を Secrets に登録する（貼り付けを求められる）
gh secret set CLAUDE_CODE_OAUTH_TOKEN -R sho3690/ichiyo
```

登録できたか確かめるには、GitHub の Actions タブで「頁を書く」を手動実行する。

```sh
gh workflow run daily.yml -R sho3690/ichiyo
```

## 手で書きたいとき

`data/essays.json` に同じ形で1件足してコミットすればよい。すでにある日付は Actions が上書きしない。

手元で試し書きするなら:

```sh
node scripts/write-tomorrow.mjs --dry-run --date 2026-10-01
```
