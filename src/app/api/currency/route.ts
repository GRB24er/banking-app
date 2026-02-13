// src/app/api/currency/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { 
  getAllCurrencies, 
  getAllExchangeRates, 
  getExchangeRate, 
  convertCurrency, 
  initializeExchangeRates,
  fetchLiveRates,
  formatCurrency 
} from '@/lib/currencyService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'currencies';
    const base = searchParams.get('base') || 'USD';

    // Initialize rates if needed
    await initializeExchangeRates();

    switch (action) {
      case 'currencies':
        const currencies = getAllCurrencies();
        return NextResponse.json({ success: true, currencies });

      case 'rates':
        const rates = await getAllExchangeRates(base);
        return NextResponse.json({ success: true, base, rates });

      case 'rate':
        const from = searchParams.get('from') || 'USD';
        const to = searchParams.get('to') || 'EUR';
        const rate = await getExchangeRate(from, to);
        return NextResponse.json({ success: true, from, to, ...rate });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Currency] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch currency data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, amount, from, to } = await request.json();

    switch (action) {
      case 'convert':
        if (!amount || !from || !to) {
          return NextResponse.json({ error: 'Amount, from, and to currencies required' }, { status: 400 });
        }
        const conversion = await convertCurrency(amount, from, to);
        if (!conversion) {
          return NextResponse.json({ error: 'Conversion not available' }, { status: 400 });
        }
        return NextResponse.json({ 
          success: true, 
          ...conversion,
          formattedOriginal: formatCurrency(conversion.originalAmount, from),
          formattedConverted: formatCurrency(conversion.convertedAmount, to),
        });

      case 'refresh':
        // Admin only - refresh rates from API
        const refreshed = await fetchLiveRates();
        return NextResponse.json({ 
          success: refreshed, 
          message: refreshed ? 'Rates updated' : 'Failed to update rates' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Currency] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
