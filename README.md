# @pipeworx/nyt

New York Times Developer APIs: article search, top stories by section, bestseller
lists and movie reviews, as headlines, abstracts, bylines and nytimes.com URLs.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1679+ live data sources.

## Tools

- `search_articles(query, page?, begin_date?, sort?)` — full-text search of NYT
  articles (Article Search API); 10 results per page, newest first by default.
  Exposed on the gateway as `nyt_search_articles` (eight packs export a
  `search_articles`; the bare name is ambiguous).
- `top_stories(section?)` — the current top stories for a section
  (`home`, `world`, `business`, `technology`, `science`, `health`, `sports`,
  `arts`, …).
- `books_bestsellers(list?)` — the current bestseller list by list name
  (`hardcover-fiction`, `hardcover-nonfiction`,
  `combined-print-and-e-book-fiction`, …): rank, title, author, publisher,
  weeks on list.
- `movie_reviews(query?, critics_pick?)` — NYT movie reviews, optionally
  filtered to Critics' Picks.

## Auth

Platform key (`PLATFORM_NYT_KEY`) with BYO override via `_apiKey`. The key is
sent as the `api-key` query parameter. Upstream limits per API (portal FAQ #11):
500 requests per day and 5 requests per minute; the pack has no backoff, so a
tight agent loop can hit the per-minute ceiling.

## Licence terms (read 2026-09-14, fleet #1977; resolved 2026-09-15, fleet #1980)

The NYT API Terms of Use are **non-commercial only**, and the portal FAQ defines
"commercial" to include *"using our content inside an application that is paid
or has a paid tier currently or in the future"*. They also forbid providing
*"archived or cached data sets containing Content to another person or entity"*
and cap any caching at 24 hours; the Branding guide requires the attribution
*"Data provided by The New York Times"* (or the Times API logo) wherever the
content is displayed, and unmodified headlines and links. The verbatim clauses,
the bucket verdict and the traffic numbers are in
`docs/data/vendor-tos-audit.md` (addendum 2026-09-14). Do not add a mirror or
ingest of NYT content, and do not re-read the terms: the portal page is a JS
shell, the text is served by
`/portals/api/sites/nyt-apigeex-prd-devportal/liveportal/page/terms`.

**Resolved 2026-09-15**: Bruce chose `zero-rate-attribute` over asking NYT
Licensing for written permission. The gateway pack entry carries
`zeroRated: true` (0 credits, no pricing-v2 bracket advance) and every tool
response carries an `attribution` field — *"Data provided by The New York
Times (developer.nytimes.com). Non-commercial use only under the NYT
Developer Terms of Use; Pipeworx charges nothing for this data."* This is
good faith, **not** compliance: NYT's FAQ still calls a paid-tier app
commercial, and §1(e)(v) still requires written permission to share access
"whether for direct commercial or monetary gain or otherwise". Same posture
already accepted for guardian/last-fm/watchmode/acled on 2026-08-18. Do not
remove either mechanism without a fresh Bruce decision.

## Data sources

- <https://api.nytimes.com/svc/search/v2/articlesearch.json> — Article Search.
- <https://api.nytimes.com/svc/topstories/v2/{section}.json> — Top Stories.
- <https://api.nytimes.com/svc/books/v3/lists/current/{list}.json> — Books.
- <https://api.nytimes.com/svc/movies/v2/reviews/search.json> — Movie Reviews.
- <https://developer.nytimes.com/> — portal, terms (`/terms`), attribution
  guide (`/branding`), FAQ (`/faq`).

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "nyt": {
      "url": "https://gateway.pipeworx.io/nyt/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/nyt/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1679+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/nyt_search_articles \
  -H 'Content-Type: application/json' \
  -d '{"query":"climate change","sort":"newest"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/nyt_search_articles`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "nyt": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-nyt"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-nyt
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Nyt data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
