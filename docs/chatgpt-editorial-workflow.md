# TECH CURRENT 編集・公開フロー（追加API課金なし）

## 役割
- GitHub Actions: `collect-news.yml` が4時間ごとに公式ソースの見出し候補を収集。成果物 `news-candidates` に保存する。記事は自動公開しない。
- ChatGPT: 候補の一次情報を調査・検証し、オリジナルの日本語記事を執筆する。GitHub連携を通じて `data/articles.json` を更新する。
- GitHub Actions: `npm run build` で記事データを検証する。
- Cloudflare Pages: GitHubの更新に連動してサイトを公開する。

## 手順
1. Actionsの `Collect overseas news candidates` の最新成功実行から `news-candidates` を確認する。必要なら手動実行も可能。
2. ChatGPTに「TECH CURRENTのニュース候補を調べて、記事化候補を提案して」と依頼する。
3. 採用記事を指定し、一次情報の確認、重複確認、日付と数字の検証、日本語本文の作成を依頼する。
4. 公開前に記事内容を確認する。推測と事実を分け、根拠がない記述を掲載しない。
5. 承認した記事だけを `data/articles.json` に `published` として登録する。既存IDとslugは再利用しない。
6. GitHub Actionsの検証成功とCloudflare Pagesの表示を確認する。

## 注意
- OpenAI Platform APIキーは不要。ChatGPTとGitHub連携による対話ベースの編集方式。
- 無人でのAI記事自動生成・自動公開は行わない。
- ニュース候補の収集は記事の正確性を保証しない。必ず公式一次情報を確認する。
- SAPPORO＋、IMARIUMのリポジトリには変更を加えない。
