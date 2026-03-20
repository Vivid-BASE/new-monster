# Resend + Cloudflare Worker 設定ガイド

応募フォームの内容を `showtimelabel@gmail.com` に届くように設定する手順です。

## 1. Cloudflare Worker の作成
1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログインします。
2. **Workers & Pages** → **Create application** → **Create Worker** をクリックします。
3. 名前を入力（例: `vgp-audition-worker`）して **Deploy** します。
4. **Edit Code** をクリックし、`worker.js` の内容を添付の `resend_worker.js` の内容に全て書き換えて **Save and Deploy** します。

## 2. 環境変数の設定
1. Worker の管理画面で **Settings** → **Variables** を開きます。
2. **Environment Variables** に以下の2つを追加して **Save and deploy** します：
   - `RESEND_API_KEY`: `re_ax7AxUNW_CT7ApUudc1hvwUNZwkcPfgg9`
   - `NOTIFICATION_EMAIL`: `showtimelabel@gmail.com`

## 3. `index.html` への反映
1. Worker のダッシュボードに表示されている **URL** （例: `https://vgp-audition-worker.xxx.workers.dev`）をコピーします。
2. `index.html` 内の JavaScript にある `const WORKER_URL = '...';` の部分を、コピーした実際のURLに書き換えて保存してください。

## 注意事項
- **添付ファイルのサイズ**: Cloudflare Worker および Resend には送信サイズ制限があります。多くの動画ファイルなどを一度に送るとエラーになる可能性があるため、サイズの大きいものは YouTube 等の URL 送信を推奨してください。
- **Resend の制限**: 初期状態（ドメイン未認証）では、Resend から送信可能な宛先はアカウント作成時のメールアドレス（今回の場合は恐らく `showtimelabel@gmail.com`）のみに制限されています。
