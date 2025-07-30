'use client';

import Image from 'next/image';

import { EbayRankingEngine } from '@/lib/ranking-engine';
import { RankedItem } from '@/types/ebay';

interface SearchResultsProps {
  items: Array<{
    itemId: string;
    title: string;
    price: { value: string; currency: string };
    image?: { imageUrl: string };
    itemWebUrl: string;
    condition: string;
    seller: { username: string; feedbackPercentage: number; feedbackScore: number };
    shippingOptions?: Array<{ shippingCost: { value: string; currency: string }; type: string }>;
    location: { country: string };
    shortDescription?: string;
    relevanceScore: number;
    rankingFactors?: {
      priceScore: number;
      conditionScore: number;
      sellerScore: number;
      shippingScore: number;
      keywordScore: number;
    };
    aiRankingFactors?: {
      semanticSimilarity: number;
      dealQuality: number;
      traditionalRelevance: number;
      finalScore: number;
    };
    semanticScore?: number;
    dealScore?: {
      overallScore: number;
      confidence: number;
      recommendation: string;
    };
    explanation?: {
      semanticReason?: string;
      dealReason: string;
      overallReason: string;
    };
  }>;
  isLoading: boolean;
  error: string | null;
  total: number;
}

export default function SearchResults({ items, isLoading, error, total }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Searching eBay and ranking results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Search Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or keywords.</p>
      </div>
    );
  }

  const formatPrice = (value: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(parseFloat(value));
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-lg rounded-lg p-4">
        <p className="text-gray-600">
          Found <span className="font-medium text-gray-900">{total}</span> relevant items
        </p>
      </div>

      <div className="grid gap-6">
        {items.map((item, index) => (
          <div key={item.itemId} className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Image */}
                <div className="flex-shrink-0">
                  {item.image?.imageUrl ? (
                    <Image
                      src={item.image.imageUrl}
                      alt={item.title}
                      width={192}
                      height={192}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        {formatPrice(item.price.value, item.price.currency)}
                      </p>
                    </div>
                    
                    {/* Relevance Score */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRelevanceColor(item.relevanceScore)}`}>
                      {item.relevanceScore}% match
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Condition:</span> {item.condition}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Seller:</span> {item.seller.username} 
                        <span className="text-green-600 ml-1">({item.seller.feedbackPercentage}%)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {item.location.country}
                      </p>
                      {item.shippingOptions && item.shippingOptions.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Shipping:</span> 
                          {item.shippingOptions[0].shippingCost.value === '0' ? 
                            <span className="text-green-600 ml-1">Free</span> :
                            <span className="ml-1">{formatPrice(item.shippingOptions[0].shippingCost.value, item.shippingOptions[0].shippingCost.currency)}</span>
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ranking Explanation */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    {item.aiRankingFactors ? (
                      // AI-enhanced explanation
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">🧠 AI Ranking #{index + 1}:</span> {item.explanation?.overallReason}
                        </p>
                        {item.semanticScore && (
                          <p className="text-xs text-purple-600">
                            <span className="font-medium">🔍 Semantic Match:</span> {item.semanticScore.toFixed(1)}% - {item.explanation?.semanticReason}
                          </p>
                        )}
                        {item.dealScore && (
                          <p className="text-xs text-green-600">
                            <span className="font-medium">💰 Deal Quality:</span> {item.explanation?.dealReason}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>AI: {item.aiRankingFactors.finalScore}</span>
                          <span>•</span>
                          <span>Semantic: {item.aiRankingFactors.semanticSimilarity}</span>
                          <span>•</span>
                          <span>Deal: {item.aiRankingFactors.dealQuality}</span>
                        </div>
                      </div>
                    ) : (
                      // Traditional explanation
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">📊 Traditional Ranking #{index + 1}:</span> 
                        {item.rankingFactors ? EbayRankingEngine.getScoreExplanation(item as RankedItem) : 'Standard ranking applied'}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    <a
                      href={item.itemWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      View on eBay
                      <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
