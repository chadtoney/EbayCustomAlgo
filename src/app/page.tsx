'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import SearchResults from '@/components/SearchResults';
import { SearchFormData, EbaySearchCriteria, UserPreferences, RankedItem } from '@/types/ebay';

export default function Home() {
  const [searchResults, setSearchResults] = useState<RankedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (formData: SearchFormData) => {
    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      // Convert form data to API format
      const searchCriteria: EbaySearchCriteria = {
        keywords: formData.keywords,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
        condition: (formData.condition as 'NEW' | 'USED' | 'UNSPECIFIED') || undefined,
        freeShipping: formData.freeShipping,
        buyItNow: formData.buyItNow,
        sortOrder: formData.sortBy as 'BestMatch' | 'CurrentPriceHighest' | 'PricePlusShippingHighest' | 'PricePlusShippingLowest' | 'StartTimeNewest'
      };

      const userPreferences: UserPreferences = {
        maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
        preferredCondition: formData.condition ? [formData.condition] : undefined,
        minimumSellerRating: parseFloat(formData.minSellerRating),
        freeShippingOnly: formData.freeShipping,
        keywords: formData.keywords.split(' ').filter(keyword => keyword.length > 2)
      };

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchCriteria,
          userPreferences,
          useAIRanking: formData.useAIRanking
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.items);
      setTotalResults(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🛒 Personal eBay Shopping Agent
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find exactly what you&apos;re looking for using custom filters and intelligent ranking. 
            Skip eBay&apos;s algorithm and search with your own criteria.
          </p>
        </div>

        {/* Search Form */}
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {/* Search Results */}
        <SearchResults 
          items={searchResults} 
          isLoading={isLoading} 
          error={error} 
          total={totalResults}
        />

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>
            Built with Next.js, TypeScript, and the eBay Browse API. 
            This is a demonstration project for custom eBay search algorithms.
          </p>
        </footer>
      </div>
    </div>
  );
}
