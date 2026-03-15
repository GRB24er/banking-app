import { NextResponse } from "next/server";

const MAJOR_CURRENCIES = [
  "EUR", "GBP", "CHF", "JPY", "AUD", "CAD", "SGD", "HKD",
  "NOK", "SEK", "DKK", "PLN", "CZK", "HUF", "TRY", "ZAR",
  "BRL", "MXN", "INR", "CNY"
];

const SPREAD = 0.005; // 0.5% spread

interface CachedRates {
  rates: Record<string, { mid: number; buy: number; sell: number }>;
  last_updated: string;
  fetchedAt: number;
}

let cache: CachedRates | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

async function fetchRates(): Promise<CachedRates> {
  // Return cache if still valid
  if (cache && Date.now() - cache.fetchedAt < CACHE_DURATION_MS) {
    return cache;
  }

  const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    // If fetch fails but we have stale cache, return it
    if (cache) return cache;
    throw new Error("Failed to fetch exchange rates");
  }

  const data = await res.json();

  const rates: Record<string, { mid: number; buy: number; sell: number }> = {};

  for (const code of MAJOR_CURRENCIES) {
    const mid = data.rates?.[code];
    if (mid) {
      rates[code] = {
        mid: mid,
        buy: parseFloat((mid * (1 + SPREAD)).toFixed(6)),
        sell: parseFloat((mid * (1 - SPREAD)).toFixed(6)),
      };
    }
  }

  cache = {
    rates,
    last_updated: new Date().toISOString(),
    fetchedAt: Date.now(),
  };

  return cache;
}

export async function GET() {
  try {
    const data = await fetchRates();
    return NextResponse.json({
      success: true,
      base: "USD",
      rates: data.rates,
      last_updated: data.last_updated,
    });
  } catch (error: any) {
    console.error("[Exchange Rates] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exchange rates" },
      { status: 500 }
    );
  }
}
