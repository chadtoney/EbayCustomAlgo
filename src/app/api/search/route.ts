import { NextRequest, NextResponse } from 'next/server';
import { ebayAPI } from '@/lib/ebay-api';
import { EbayRankingEngine } from '@/lib/ranking-engine';
import { EnhancedEbayRankingEngine } from '@/lib/enhanced-ranking-engine';
import { EbaySearchCriteria, UserPreferences } from '@/types/ebay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchCriteria, userPreferences, useAIRanking } = body as {
      searchCriteria: EbaySearchCriteria;
      userPreferences: UserPreferences;
      useAIRanking?: boolean;
    };

    // Validate required fields
    if (!searchCriteria.keywords) {
      return NextResponse.json(
        { error: 'Keywords are required for search' },
        { status: 400 }
      );
    }

    // Search eBay items
    console.log('Searching eBay with criteria:', searchCriteria);
    const items = await ebayAPI.searchItems(searchCriteria, 100);

    if (!items || items.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        message: 'No items found for your search criteria'
      });
    }

    // Apply ranking algorithm (AI-enhanced or traditional)
    let rankedItems;
    if (useAIRanking) {
      console.log('🧠 Using AI-enhanced ranking...');
      rankedItems = await EnhancedEbayRankingEngine.rankItemsWithAI(
        items, 
        userPreferences,
        searchCriteria.keywords
      );
    } else {
      console.log('📊 Using traditional ranking...');
      rankedItems = EbayRankingEngine.rankItems(items, userPreferences);
    }

    // Limit results to top 50 items
    const topItems = rankedItems.slice(0, 50);

    return NextResponse.json({
      items: topItems,
      total: topItems.length,
      originalTotal: items.length,
      aiEnhanced: useAIRanking || false,
      message: `Found ${topItems.length} relevant items out of ${items.length} total results${useAIRanking ? ' (AI-enhanced ranking)' : ''}`
    });

  } catch (error) {
    console.error('Search API error:', error);
    
    // Handle specific eBay API errors
    if (error instanceof Error) {
      if (error.message.includes('authenticate')) {
        return NextResponse.json(
          { error: 'eBay API authentication failed. Please check your credentials.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An error occurred while searching eBay. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Handle health check for the API
  return NextResponse.json({
    status: 'OK',
    message: 'eBay Search API is running',
    timestamp: new Date().toISOString()
  });
}
