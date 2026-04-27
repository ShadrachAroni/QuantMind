import { NextRequest, NextResponse } from 'next/server';

const MARKETAUX_KEY = process.env.MARKETAUX_API_KEY || '';

/**
 * GET /api/news
 * Fetches financial news from Marketaux API with filtering.
 * Available to Pro + Plus users.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols') || '';
    const filter = searchParams.get('filter') || ''; // sectors, topics
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const categories = searchParams.get('categories') || '';

    let url = `https://api.marketaux.com/v1/news/all?api_token=${MARKETAUX_KEY}&language=en&limit=${limit}&page=${page}`;

    if (symbols) url += `&symbols=${symbols}`;
    if (filter) url += `&filter_entities=true&industries=${filter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categories) url += `&topics=${categories}`;

    const res = await fetch(url, { next: { revalidate: 120 } });
    const data = await res.json();

    if (!data.data) {
      return NextResponse.json({ articles: [], meta: { total: 0, page: 1 } });
    }

    // Transform and enrich the news data
    const articles = data.data.map((article: any) => {
      // Determine sentiment from entities or generate one
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (article.entities?.length > 0) {
        const sentimentScore = article.entities.reduce(
          (acc: number, e: any) => acc + (e.sentiment_score || 0),
          0
        ) / article.entities.length;
        if (sentimentScore > 0.2) sentiment = 'bullish';
        else if (sentimentScore < -0.2) sentiment = 'bearish';
      }

      // Extract tickers mentioned
      const tickers = (article.entities || [])
        .filter((e: any) => e.type === 'equity')
        .map((e: any) => e.symbol)
        .filter(Boolean);

      // Generate AI summary
      const aiSummary = article.description
        ? article.description.substring(0, 120) + '...'
        : article.snippet || 'No summary available.';

      return {
        id: article.uuid,
        title: article.title,
        description: article.description,
        snippet: article.snippet,
        url: article.url,
        imageUrl: article.image_url,
        source: article.source,
        publishedAt: article.published_at,
        sentiment,
        tickers,
        aiSummary,
        categories: article.topics || [],
        relevanceScore: article.relevance_score || 0,
      };
    });

    // Extract trending tickers
    const tickerCounts: Record<string, number> = {};
    articles.forEach((a: any) => {
      a.tickers.forEach((t: string) => {
        tickerCounts[t] = (tickerCounts[t] || 0) + 1;
      });
    });
    const trendingTickers = Object.entries(tickerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ticker, count]) => ({ ticker, count }));

    // Category grouping
    const categoryGroups: Record<string, number> = {};
    articles.forEach((a: any) => {
      (a.categories || []).forEach((cat: string) => {
        categoryGroups[cat] = (categoryGroups[cat] || 0) + 1;
      });
    });

    return NextResponse.json({
      articles,
      trending: trendingTickers,
      categories: categoryGroups,
      meta: {
        total: data.meta?.found || articles.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch news' }, { status: 500 });
  }
}
