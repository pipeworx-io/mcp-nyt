# mcp-nyt

NYT MCP — wraps The New York Times Developer APIs (developer.nytimes.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_articles` | Full-text search of New York Times news articles. Returns headlines, abstracts, sections, bylines, and URLs. Example: search_articles({ query: "artificial intelligence", sort: "newest" }) |
| `top_stories` | Get current New York Times top stories for a section (home, world, business, technology, science, health, sports, arts, etc.). Returns titles, abstracts, bylines, and URLs. Example: top_stories({ section: "technology" }) |
| `books_bestsellers` | Get a current New York Times bestselling books list (e.g. hardcover-fiction, hardcover-nonfiction, combined-print-and-e-book-fiction). Returns rank, title, author, description, publisher, and weeks on list. Example: books_bestsellers({ list: "hardcover-fiction" }) |
| `movie_reviews` | Search New York Times movie reviews. Optionally filter by query or critics picks. Returns title, summary, byline, publication date, and URL. Example: movie_reviews({ query: "dune", critics_pick: true }) |

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

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

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

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/nyt_search_articles \
  -H 'Content-Type: application/json' \
  -d '{"query":"climate change","sort":"newest"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/nyt_search_articles`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
