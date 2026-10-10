# TECH CURRENT article workflow

GitHub is the sole source of truth. Store editorial articles in `data/articles.json`.

## Required fields for publication
- `articleId`: sequential `TC-0001`, `TC-0002` etc.
- `slug`: unique URL-safe identifier
- `title`, `description`, `category`
- `body`: array of original Japanese paragraphs
- `sourceName`, `sourceUrl`: attributable primary source
- `publishedAt`: valid ISO timestamp
- `status`: `draft`, `review`, or `published`

Draft/review entries are not rendered. A published entry gets a static route at `/articles/{slug}/`.

## Editorial safeguards
1. Read and check the source article, not just its RSS title.
2. Distinguish confirmed claims from interpretation; avoid invented quotes or numbers.
3. Check announcement date, product availability, pricing and Japan relevance.
4. Write an independent Japanese summary and analysis, not a translation reproducing copyrighted text.
5. Review article accuracy and links before changing status to `published`.
6. Never store API keys or secrets in Git.
