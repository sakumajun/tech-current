# TECH CURRENT 編集・公開フロー（日英同時公開・追加API課金なし）

## 役割
- GitHub Actions: `collect-news.yml` が4時間ごとに公式ソースの見出し候補を収集し、成果物 `news-candidates` に保存する。候補は自動公開しない。
- ChatGPT: 候補の一次情報を調査・検証し、日本語・英語の記事を執筆する。GitHub連携で `data/articles.json` を更新する。
- GitHub Actions: `npm run build` で記事データの必須項目と日英翻訳を検証し、日英サイトマップを生成する。
- Cloudflare Pages: GitHubの更新に連動してサイトを公開する。

## 日英記事の公開手順
1. Actionsの `Collect overseas news candidates` の最新成功実行から `news-candidates` を確認する。必要なら手動実行する。
2. 候補の一次情報を確認し、記事化の優先順位、公開日、数値、既存記事との重複を調べる。
3. 日本語と英語のタイトル、説明文、カテゴリ、本文、出典表記を用意する。機械的な逐語訳ではなく、同じ事実に基づく自然な英語にする。
4. 公開前の確認用記事は `status: "review"` として管理する。公開前に一次情報、事実と解釈の区別、日英の内容一致を確認する。
5. 採用・承認した記事だけを `status: "published"` に変更する。既存の `articleId` と `slug` は再利用しない。
6. `published` 記事には `en.title`, `en.description`, `en.category`, `en.sourceName`, `en.body` が必須。欠けていればビルドが失敗し、日本語だけ先に公開されない。
7. GitHub Actionsのビルド成功、Cloudflare Pagesでの日英表示、日英相互リンクとサイトマップを確認する。

## 運用上の注意
- OpenAI Platform APIキーやGoogle Sheetsは不要。ChatGPTとGitHub連携による対話ベースの編集方式。
- 無人でのAI記事自動生成・自動公開は行わない。
- ニュース候補の収集は記事の正確性を保証しない。必ず公式一次情報を確認する。
- 記事本文は公式発表の転載ではなく、独自の要約・解説として執筆する。
- SAPPORO＋、IMARIUMのリポジトリには変更を加えない。
