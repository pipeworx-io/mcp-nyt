# mcp-nyt

NYT MCP — wraps The New York Times Developer APIs (developer.nytimes.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Nyt data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
