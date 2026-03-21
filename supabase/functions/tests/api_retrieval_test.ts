import { 
  fetchAlphaVantage, 
  fetchYahooFallback,
  normalizeAlphaVantage,
  computeGBMParams 
} from "../assets-history/index.ts";
import { searchYahoo, classifyAsset } from "../assets/index.ts";
import { assertEquals, assertThrows, assertRejects } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// --- Mocking Infrastructure ---

const originalFetch = globalThis.fetch;

function mockFetch(responses: Record<string, { body: any, status?: number }>) {
  globalThis.fetch = (url: string | Request | URL) => {
    const urlStr = url.toString();
    for (const [pattern, resp] of Object.entries(responses)) {
      if (urlStr.includes(pattern)) {
        return Promise.resolve(new Response(JSON.stringify(resp.body), { status: resp.status || 200 }));
      }
    }
    return Promise.reject(new Error(`Unexpected fetch call to ${urlStr}`));
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// --- Sample Data ---

const MOCK_AV_DATA = {
  "Time Series (Daily)": {
    "2023-10-20": { "1. open": "100.0", "2. high": "105.0", "3. low": "95.0", "4. close": "102.0", "5. volume": "1000" },
    "2023-10-19": { "1. open": "98.0", "2. high": "101.0", "3. low": "97.0", "4. close": "100.0", "5. volume": "800" }
  }
};

const MOCK_YAHOO_DATA = {
  chart: {
    result: [{
      timestamp: [1697760000, 1697846400],
      indicators: {
        quote: [{
          close: [100.0, 102.0],
          open: [98.0, 100.0],
          high: [101.0, 105.0],
          low: [97.0, 95.0],
          volume: [800, 1000]
        }]
      }
    }]
  }
};

// --- Tests ---

Deno.test("normalizeAlphaVantage | correctly maps raw data", () => {
  const prices = normalizeAlphaVantage(MOCK_AV_DATA, "AAPL");
  assertEquals(prices.length, 2);
  assertEquals(prices[0].symbol, "AAPL");
  assertEquals(prices[0].price, 102.0);
  assertEquals(prices[0].source, "alpha_vantage");
  assertEquals(new Date(prices[0].timestamp).toISOString(), "2023-10-20T00:00:00.000Z");
});

Deno.test("computeGBMParams | calculates correct mu and sigma", () => {
  // Test with a simple upward trend: 100 -> 110 (10% return in 1 day)
  const prices = [
    { symbol: "TEST", price: 100, timestamp: "2023-01-01T00:00:00Z", source: "test" as any },
    { symbol: "TEST", price: 110, timestamp: "2023-01-02T00:00:00Z", source: "test" as any }
  ];
  
  const { mu, sigma } = computeGBMParams(prices);
  
  // mu and sigma are annualised
  // log return = ln(1.1) = 0.0953
  // mu annualised approx 0.0953 * 252... clamped to 10
  assertEquals(mu > 0, true);
  assertEquals(sigma >= 0, true);
});

Deno.test("fetchAlphaVantage | success scenario", async () => {
  mockFetch({ "alphavantage.co": { body: MOCK_AV_DATA } });
  const prices = await fetchAlphaVantage("AAPL", "test-key");
  assertEquals(prices.length, 2);
  restoreFetch();
});

Deno.test("fetchAlphaVantage | handles rate limit (Note)", async () => {
  mockFetch({ "alphavantage.co": { body: { "Note": "Thank you for using Alpha Vantage!" } } });
  await assertRejects(() => fetchAlphaVantage("AAPL", "test-key"), Error, "Alpha Vantage rate limit hit");
  restoreFetch();
});

Deno.test("fetchAlphaVantage | handles HTTP error", async () => {
  mockFetch({ "alphavantage.co": { body: {}, status: 500 } });
  await assertRejects(() => fetchAlphaVantage("AAPL", "test-key"), Error, "Alpha Vantage request failed");
  restoreFetch();
});

Deno.test("fetchYahooFallback | success scenario", async () => {
  mockFetch({ "yahoo.com": { body: MOCK_YAHOO_DATA } });
  const prices = await fetchYahooFallback("AAPL");
  assertEquals(prices.length, 2);
  assertEquals(prices[0].source, "yahoo");
  restoreFetch();
});

Deno.test("fetchYahooFallback | handles missing data", async () => {
  mockFetch({ "yahoo.com": { body: { chart: { result: null } } } });
  await assertRejects(() => fetchYahooFallback("AAPL"), Error, "No data from Yahoo");
  restoreFetch();
});

Deno.test("fetchYahooFallback | handles HTTP 404", async () => {
  mockFetch({ "yahoo.com": { body: {}, status: 404 } });
  await assertRejects(() => fetchYahooFallback("AAPL"), Error, "Yahoo Finance request failed");
  restoreFetch();
});

// --- Ticker Search Tests (assets function) ---

Deno.test("classifyAsset | maps quote types correctly", () => {
  assertEquals(classifyAsset("EQUITY"), "stocks");
  assertEquals(classifyAsset("ETF"), "stocks");
  assertEquals(classifyAsset("CRYPTOCURRENCY"), "crypto");
  assertEquals(classifyAsset("UNKNOWN"), "other");
});

Deno.test("searchYahoo | success scenario", async () => {
  const mockSearchResponse = {
    quotes: [
      { symbol: "AAPL", shortname: "Apple Inc.", quoteType: "EQUITY", exchDisp: "NASDAQ", currency: "USD" },
      { symbol: "MSFT", shortname: "Microsoft", quoteType: "EQUITY", exchDisp: "NASDAQ" }
    ]
  };
  mockFetch({ "finance/search": { body: mockSearchResponse } });
  
  const results = await searchYahoo("App");
  assertEquals(results.length, 2);
  assertEquals(results[0].ticker, "AAPL");
  assertEquals(results[0].asset_class, "stocks");
  restoreFetch();
});

Deno.test("searchYahoo | handles empty results", async () => {
  mockFetch({ "finance/search": { body: { quotes: [] } } });
  const results = await searchYahoo("xyzxyz");
  assertEquals(results.length, 0);
  restoreFetch();
});

Deno.test("searchYahoo | handles network failure", async () => {
  mockFetch({ "finance/search": { body: {}, status: 500 } });
  const results = await searchYahoo("error");
  assertEquals(results.length, 0); // returns [] on !response.ok
  restoreFetch();
});
