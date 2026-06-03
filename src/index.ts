interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * NYT MCP — wraps The New York Times Developer APIs (developer.nytimes.com)
 *
 * Tools:
 * - search_articles: full-text search of New York Times news articles
 * - top_stories: current NYT top stories by section
 * - books_bestsellers: NYT bestselling books lists
 * - movie_reviews: NYT movie reviews search
 *
 * Dual key model: pass your own NYT key via _apiKey (optional) for higher
 * limits, or omit to use the shared Pipeworx key. The key is sent as the
 * `api-key` query parameter. All requests are GET.
 */


const BASE_URL = 'https://api.nytimes.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_articles',
    description:
      'Full-text search of New York Times news articles. Returns headlines, abstracts, sections, bylines, and URLs. Example: search_articles({ query: "artificial intelligence", sort: "newest" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query — keywords or phrase to search New York Times articles for.',
        },
        page: {
          type: 'number',
          description: 'Result page (0-indexed, 10 results per page). Default 0.',
        },
        begin_date: {
          type: 'string',
          description: 'Earliest article date in YYYYMMDD format, e.g. "20240101" (optional).',
        },
        sort: {
          type: 'string',
          enum: ['newest', 'oldest', 'relevance'],
          description: 'Sort order for results. Default "newest".',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own NYT API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'top_stories',
    description:
      'Get current New York Times top stories for a section (home, world, business, technology, science, health, sports, arts, etc.). Returns titles, abstracts, bylines, and URLs. Example: top_stories({ section: "technology" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        section: {
          type: 'string',
          description:
            'Section name, e.g. "home", "world", "business", "technology", "science", "health", "sports", "arts". Default "home".',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own NYT API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: [],
    },
  },
  {
    name: 'books_bestsellers',
    description:
      'Get a current New York Times bestselling books list (e.g. hardcover-fiction, hardcover-nonfiction, combined-print-and-e-book-fiction). Returns rank, title, author, description, publisher, and weeks on list. Example: books_bestsellers({ list: "hardcover-fiction" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        list: {
          type: 'string',
          description:
            'Bestseller list name, e.g. "hardcover-fiction", "hardcover-nonfiction", "combined-print-and-e-book-fiction". Default "hardcover-fiction".',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own NYT API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: [],
    },
  },
  {
    name: 'movie_reviews',
    description:
      'Search New York Times movie reviews. Optionally filter by query or critics picks. Returns title, summary, byline, publication date, and URL. Example: movie_reviews({ query: "dune", critics_pick: true })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query — movie title or keyword (optional).',
        },
        critics_pick: {
          type: 'boolean',
          description: 'If true, only return reviews flagged as NYT Critics’ Picks (optional).',
        },
        _apiKey: {
          type: 'string',
          description:
            'Optional — your own NYT API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: [],
    },
  },
];

// -- HTTP helper -------------------------------------------------------------

interface NytError {
  error: string | number;
  message: string;
}

async function nytGet(
  apiKey: string,
  path: string,
  params: URLSearchParams,
): Promise<unknown | NytError> {
  if (!apiKey) {
    return { error: 'api_key_required', message: 'No NYT key available.' };
  }
  params.set('api-key', apiKey);
  const res = await fetch(`${BASE_URL}${path}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    return { error: res.status, message: text };
  }
  return res.json();
}

// -- callTool dispatcher -----------------------------------------------------

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string;
  delete args._apiKey;

  switch (name) {
    case 'search_articles':
      return searchArticles(args, apiKey);
    case 'top_stories':
      return topStories(args, apiKey);
    case 'books_bestsellers':
      return booksBestsellers(args, apiKey);
    case 'movie_reviews':
      return movieReviews(args, apiKey);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// -- Tool implementations ----------------------------------------------------

interface ArticleDoc {
  headline?: { main?: string };
  abstract?: string;
  web_url?: string;
  pub_date?: string;
  section_name?: string;
  byline?: { original?: string };
}

async function searchArticles(args: Record<string, unknown>, apiKey: string) {
  const params = new URLSearchParams();
  params.set('q', (args.query as string) ?? '');
  params.set('page', String((args.page as number) ?? 0));
  params.set('sort', (args.sort as string) ?? 'newest');
  if (args.begin_date) params.set('begin_date', args.begin_date as string);

  const data = await nytGet(apiKey, '/svc/search/v2/articlesearch.json', params);
  if (isError(data)) return data;

  const response = (data as { response?: { meta?: { hits?: number }; docs?: ArticleDoc[] } }).response;
  return {
    hits: response?.meta?.hits,
    articles: (response?.docs ?? []).map((d) => ({
      headline: d.headline?.main,
      abstract: d.abstract,
      url: d.web_url,
      published: d.pub_date,
      section: d.section_name,
      byline: d.byline?.original,
    })),
  };
}

interface TopStory {
  title?: string;
  abstract?: string;
  url?: string;
  byline?: string;
  published_date?: string;
  section?: string;
}

async function topStories(args: Record<string, unknown>, apiKey: string) {
  const section = (args.section as string) ?? 'home';
  const params = new URLSearchParams();

  const data = await nytGet(
    apiKey,
    `/svc/topstories/v2/${encodeURIComponent(section)}.json`,
    params,
  );
  if (isError(data)) return data;

  const results = (data as { results?: TopStory[] }).results ?? [];
  return {
    section,
    results: results.map((r) => ({
      title: r.title,
      abstract: r.abstract,
      url: r.url,
      byline: r.byline,
      published: r.published_date,
      section: r.section,
    })),
  };
}

interface BestsellerBook {
  rank?: number;
  title?: string;
  author?: string;
  description?: string;
  publisher?: string;
  weeks_on_list?: number;
}

async function booksBestsellers(args: Record<string, unknown>, apiKey: string) {
  const list = (args.list as string) ?? 'hardcover-fiction';
  const params = new URLSearchParams();

  const data = await nytGet(
    apiKey,
    `/svc/books/v3/lists/current/${encodeURIComponent(list)}.json`,
    params,
  );
  if (isError(data)) return data;

  const results = (data as {
    results?: { list_name?: string; published_date?: string; books?: BestsellerBook[] };
  }).results;
  return {
    list_name: results?.list_name,
    published_date: results?.published_date,
    books: (results?.books ?? []).map((b) => ({
      rank: b.rank,
      title: b.title,
      author: b.author,
      description: b.description,
      publisher: b.publisher,
      weeks_on_list: b.weeks_on_list,
    })),
  };
}

interface MovieReview {
  display_title?: string;
  summary_short?: string;
  critics_pick?: number;
  byline?: string;
  publication_date?: string;
  link?: { url?: string };
}

async function movieReviews(args: Record<string, unknown>, apiKey: string) {
  const params = new URLSearchParams();
  if (args.query) params.set('query', args.query as string);
  if (args.critics_pick) params.set('critics-pick', 'Y');

  const data = await nytGet(apiKey, '/svc/movies/v2/reviews/search.json', params);
  if (isError(data)) return data;

  const results = (data as { results?: MovieReview[] }).results ?? [];
  return {
    reviews: results.map((r) => ({
      title: r.display_title,
      summary: r.summary_short,
      critics_pick: r.critics_pick === 1,
      byline: r.byline,
      publication_date: r.publication_date,
      url: r.link?.url,
    })),
  };
}

function isError(data: unknown): data is NytError {
  return typeof data === 'object' && data !== null && 'error' in data;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
