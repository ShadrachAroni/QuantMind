'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Search, ExternalLink, Clock, X, ChevronRight, Flame } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Top Stories', 'Markets', 'Earnings', 'Macro', 'Crypto', 'Commodities'];
const SENTIMENT_STYLES = {
  bullish: { bg: 'bg-[#32D74B]/10', text: 'text-[#32D74B]', border: 'border-[#32D74B]/20' },
  bearish: { bg: 'bg-[#FF453A]/10', text: 'text-[#FF453A]', border: 'border-[#FF453A]/20' },
  neutral: { bg: 'bg-[#848D97]/10', text: 'text-[#848D97]', border: 'border-[#848D97]/20' },
};

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Top Stories');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const fetchNews = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search) params.set('search', search);
      if (activeCategory !== 'Top Stories') params.set('categories', activeCategory.toLowerCase());
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTrending(data.trending || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchNews(page); }, [activeCategory, search, page]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <FeatureGate requiredTier="plus" featureName="Financial News Feed">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded text-[10px] font-bold text-[#00D9FF] uppercase tracking-widest flex items-center gap-1">
              <Newspaper size={10} /> News_Terminal
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter font-mono">News & <span className="text-[#00D9FF]">Trends</span></h1>
          <p className="text-[#848D97] text-sm font-mono uppercase tracking-widest mt-1">Real-Time Financial Intelligence</p>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848D97]" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)} placeholder="Search by ticker, topic, or keyword..." aria-label="Search news" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00D9FF]/40 transition-colors" />
            {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white" aria-label="Clear search"><X size={14} /></button>}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }} className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all", activeCategory === cat ? 'bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20' : 'bg-white/5 text-[#848D97] border border-transparent hover:bg-white/10 hover:text-white')}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[#00D9FF] border-t-transparent rounded-full animate-spin" /></div>
            ) : articles.length === 0 ? (
              <GlassCard className="p-12 text-center"><p className="text-[#848D97] text-sm">No articles found. Try adjusting your filters.</p></GlassCard>
            ) : (
              articles.map(article => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <GlassCard className="p-5 hover:border-[#00D9FF]/20 transition-all duration-300 hover:bg-[#00D9FF]/[0.02]">
                    <div className="flex gap-4">
                      {article.imageUrl && (
                        <div className="hidden md:block w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                          <img src={article.imageUrl} alt={article.title || 'Article thumbnail'} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={e => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[9px] font-bold text-[#848D97] uppercase tracking-widest">{article.source}</span>
                          <span className="text-white/10">•</span>
                          <span className="text-[9px] text-[#848D97] font-mono flex items-center gap-1"><Clock size={8} />{formatTime(article.publishedAt)}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border", SENTIMENT_STYLES[article.sentiment as keyof typeof SENTIMENT_STYLES]?.bg, SENTIMENT_STYLES[article.sentiment as keyof typeof SENTIMENT_STYLES]?.text, SENTIMENT_STYLES[article.sentiment as keyof typeof SENTIMENT_STYLES]?.border)}>
                            {article.sentiment}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition-colors line-clamp-2 mb-1">{article.title}</h3>
                        <p className="text-xs text-[#848D97] line-clamp-2 mb-2">{article.aiSummary}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {article.tickers?.slice(0, 4).map((t: string) => (
                            <span key={t} className="px-1.5 py-0.5 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 rounded text-[8px] font-bold font-mono">${t}</span>
                          ))}
                          <ExternalLink size={10} className="text-white/20 ml-auto group-hover:text-[#00D9FF]" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </a>
              ))
            )}
            {articles.length > 0 && (
              <div className="flex justify-center gap-2">
                {page > 1 && <button onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-[#848D97] hover:text-white">Previous</button>}
                <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-[#848D97] hover:text-white flex items-center gap-1">Next <ChevronRight size={12} /></button>
              </div>
            )}
          </div>

          {/* Trending Sidebar */}
          <div className="space-y-4">
            <GlassCard className="p-5">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-4 flex items-center gap-2"><Flame size={12} className="text-[#FF9500]" /> Trending Tickers</h3>
              {trending.length > 0 ? trending.map((t: any, i: number) => (
                <div key={t.ticker} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#848D97] font-mono w-4">{i + 1}.</span>
                    <span className="text-sm font-mono font-bold text-white">${t.ticker}</span>
                  </div>
                  <span className="text-[10px] text-[#848D97] font-mono">{t.count} mentions</span>
                </div>
              )) : (
                <p className="text-xs text-[#848D97]">No trending data available</p>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#848D97] mb-3">Market Pulse</h3>
              <div className="space-y-2">
                {['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer'].map(sector => (
                  <div key={sector} className="flex items-center justify-between">
                    <span className="text-xs text-[#848D97]">{sector}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00D9FF]/60 rounded-full" style={{ width: `${30 + Math.random() * 60}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        <p className="text-[9px] text-white/20 text-center font-mono uppercase tracking-widest">This is not financial advice. Always do your own research.</p>
      </div>
    </FeatureGate>
  );
}
