# Japanese draft generation

The manually triggered GitHub Actions workflow `Generate Japanese editorial drafts` collects news candidates and uses the OpenAI API to generate up to three **review-only** Japanese article drafts.

## Setup
Add an Actions repository secret named `OPENAI_API_KEY` in Settings → Secrets and variables → Actions. Never put the key in files or chat.

Run Actions → Generate Japanese editorial drafts → Run workflow. Open the completed run and download the `japanese-drafts` artifact. Review `data/generated-drafts.json`.

The workflow DOES NOT commit, create a pull request, change `data/articles.json`, or publish anything. The generated drafts may be inaccurate or incomplete. Check every claim against the original source and verify dates, availability, numbers, and quotations. Do not approve without human editorial review.

The script skips sources that have no publication date, older than seven days, or already appear in `data/articles.json`. It limits the run to three articles to control API costs. It uses a basic HTML text extractor that may fail on JavaScript-heavy pages; failures are reported in `errors`. When source text is insufficient, it refuses to draft. API calls incur usage charges.
