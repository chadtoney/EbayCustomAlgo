// eBay API Types
export interface EbaySearchCriteria {
  keywords: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: 'NEW' | 'USED' | 'UNSPECIFIED';
  sellerRating?: number;
  freeShipping?: boolean;
  buyItNow?: boolean;
  sortOrder?: 'BestMatch' | 'CurrentPriceHighest' | 'PricePlusShippingHighest' | 'PricePlusShippingLowest' | 'StartTimeNewest';
}

export interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  condition: string;
  seller: {
    username: string;
    feedbackPercentage: number;
    feedbackScore: number;
  };
  shippingOptions?: Array<{
    shippingCost: {
      value: string;
      currency: string;
    };
    type: string;
  }>;
  location?: {
    country: string;
  };
  shortDescription?: string;
}

export interface EbaySearchResponse {
  href: string;
  total: number;
  next?: string;
  limit: number;
  offset: number;
  itemSummaries: EbayItem[];
}

// Custom Ranking Types
export interface UserPreferences {
  maxPrice?: number;
  preferredCondition?: string[];
  minimumSellerRating?: number;
  freeShippingOnly?: boolean;
  preferredCountries?: string[];
  keywords?: string[];
}

export interface RankedItem extends EbayItem {
  relevanceScore: number;
  rankingFactors: {
    priceScore: number;
    conditionScore: number;
    sellerScore: number;
    shippingScore: number;
    keywordScore: number;
  };
}

// Search Form Types
export interface SearchFormData {
  keywords: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  minSellerRating: string;
  freeShipping: boolean;
  buyItNow: boolean;
  sortBy: string;
  useAIRanking?: boolean;  // Enable AI-enhanced ranking
}
