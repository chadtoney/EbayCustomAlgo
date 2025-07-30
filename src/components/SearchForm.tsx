'use client';

import { useState } from 'react';
import { SearchFormData } from '@/types/ebay';

interface SearchFormProps {
  onSearch: (formData: SearchFormData) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    keywords: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    minSellerRating: '95',
    freeShipping: false,
    buyItNow: false,
    sortBy: 'BestMatch',
    useAIRanking: true  // Enable AI ranking by default
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🛒 Custom eBay Search</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keywords - Required */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Search Keywords *
          </label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            required
            placeholder="Enter what you're looking for..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Min Price ($)
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={formData.minPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Max Price ($)
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={formData.maxPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="1000.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Condition and Seller Rating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Item Condition
            </label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Condition</option>
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="UNSPECIFIED">Unspecified</option>
            </select>
          </div>
          <div>
            <label htmlFor="minSellerRating" className="block text-sm font-medium text-gray-700 mb-2">
              Min Seller Rating (%)
            </label>
            <select
              id="minSellerRating"
              name="minSellerRating"
              value={formData.minSellerRating}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="90">90%+</option>
              <option value="95">95%+</option>
              <option value="98">98%+</option>
              <option value="99">99%+</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="freeShipping"
              name="freeShipping"
              checked={formData.freeShipping}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="freeShipping" className="ml-2 block text-sm text-gray-700">
              Free Shipping Only
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="buyItNow"
              name="buyItNow"
              checked={formData.buyItNow}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="buyItNow" className="ml-2 block text-sm text-gray-700">
              Buy It Now Only
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useAIRanking"
              name="useAIRanking"
              checked={formData.useAIRanking || false}
              onChange={handleChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="useAIRanking" className="ml-2 block text-sm text-gray-700">
              🧠 AI-Enhanced Ranking
            </label>
          </div>
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            id="sortBy"
            name="sortBy"
            value={formData.sortBy}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="BestMatch">Best Match (Custom Ranking)</option>
            <option value="PricePlusShippingLowest">Price + Shipping: Low to High</option>
            <option value="PricePlusShippingHighest">Price + Shipping: High to Low</option>
            <option value="StartTimeNewest">Newest First</option>
          </select>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading || !formData.keywords.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Searching...' : 'Search eBay'}
          </button>
        </div>
      </form>
    </div>
  );
}
