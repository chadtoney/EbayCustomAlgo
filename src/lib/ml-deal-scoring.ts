import { EbayItem } from '@/types/ebay';

/**
 * Traditional ML Deal Scoring Service
 * Uses machine learning features to score eBay listings for deal quality
 * Implements logistic regression-like scoring for deal detection
 */

export interface DealFeatures {
  priceVsAverage: number;          // -1 to 1, negative = below average (good deal)
  sellerRating: number;            // 0 to 1, normalized seller rating
  shippingCostRatio: number;       // 0 to 1, shipping cost vs item price
  conditionScore: number;          // 0 to 1, condition quality score
  titleQualityScore: number;       // 0 to 1, title completeness/quality
  listingAgeScore: number;         // 0 to 1, how recent the listing is
  bidCountScore: number;           // 0 to 1, auction activity indicator
}

export interface DealScore {
  overallScore: number;            // 0 to 100, overall deal quality
  confidence: number;              // 0 to 1, confidence in the score
  factors: {
    priceScore: number;
    sellerScore: number;
    shippingScore: number;
    conditionScore: number;
    titleScore: number;
    freshnessScore: number;
  };
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Machine Learning Deal Scoring Engine
 * Implements traditional ML features for deal quality assessment
 */
export class MLDealScoringService {
  // Pre-trained weights for deal scoring (simulated for demo)
  // In production, these would be learned from historical data
  private readonly dealWeights = {
    priceVsAverage: -0.35,      // Lower price vs average = better deal
    sellerRating: 0.25,         // Higher seller rating = better deal
    shippingCostRatio: -0.15,   // Lower shipping cost = better deal
    conditionScore: 0.20,       // Better condition = better deal
    titleQualityScore: 0.10,    // Better title = more trustworthy
    listingAgeScore: 0.05,      // Newer listings might be more relevant
    bidCountScore: 0.05,        // More bids might indicate good deal
    bias: 0.15                  // Model bias term
  };

  // Market averages (would be computed from historical data in production)
  private readonly marketAverages = new Map<string, number>();

  constructor() {
    // Initialize with some sample market averages
    // In production, these would be loaded from a database or updated periodically
    this.initializeMarketAverages();
  }

  /**
   * Score a single eBay item for deal quality using ML features
   */
  public scoreDeal(item: EbayItem, marketCategory?: string): DealScore {
    try {
      // Extract features from the eBay item
      const features = this.extractFeatures(item, marketCategory);
      
      // Calculate the deal score using our trained model
      const rawScore = this.calculateDealScore(features);
      
      // Normalize to 0-100 scale
      const overallScore = Math.max(0, Math.min(100, rawScore * 100));
      
      // Calculate confidence based on feature completeness
      const confidence = this.calculateConfidence(features);
      
      // Break down individual factor scores
      const factors = this.calculateFactorScores(features);
      
      // Determine recommendation category
      const recommendation = this.getRecommendation(overallScore);

      return {
        overallScore: Math.round(overallScore * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        factors,
        recommendation
      };
    } catch (error) {
      console.error('Error scoring deal:', error);
      
      // Return neutral score on error
      return {
        overallScore: 50,
        confidence: 0.1,
        factors: {
          priceScore: 50,
          sellerScore: 50,
          shippingScore: 50,
          conditionScore: 50,
          titleScore: 50,
          freshnessScore: 50
        },
        recommendation: 'fair'
      };
    }
  }

  /**
   * Score multiple items in batch for efficiency
   */
  public scoreBatchDeals(items: EbayItem[], marketCategory?: string): DealScore[] {
    return items.map(item => this.scoreDeal(item, marketCategory));
  }

  /**
   * Extract ML features from an eBay item
   */
  private extractFeatures(item: EbayItem, marketCategory?: string): DealFeatures {
    const price = parseFloat(item.price.value);
    const marketAverage = this.getMarketAverage(marketCategory || 'general', price);

    return {
      // Price vs market average (negative = good deal)
      priceVsAverage: this.normalizePriceRatio(price, marketAverage),
      
      // Seller rating (0-1 scale)
      sellerRating: item.seller.feedbackPercentage / 100,
      
      // Shipping cost ratio (0-1 scale)
      shippingCostRatio: this.calculateShippingRatio(item, price),
      
      // Item condition score (0-1 scale)
      conditionScore: this.calculateConditionScore(item.condition),
      
      // Title quality score (0-1 scale)
      titleQualityScore: this.calculateTitleQuality(item.title),
      
      // Listing age score (0-1 scale, newer = higher)
      listingAgeScore: 0.8, // Simulated - would use actual listing date
      
      // Bid/interest count score (0-1 scale)
      bidCountScore: 0.6 // Simulated - would use actual bid count or view count
    };
  }

  /**
   * Calculate the overall deal score using trained weights
   */
  private calculateDealScore(features: DealFeatures): number {
    // Linear combination of features (like logistic regression)
    const score = 
      features.priceVsAverage * this.dealWeights.priceVsAverage +
      features.sellerRating * this.dealWeights.sellerRating +
      features.shippingCostRatio * this.dealWeights.shippingCostRatio +
      features.conditionScore * this.dealWeights.conditionScore +
      features.titleQualityScore * this.dealWeights.titleQualityScore +
      features.listingAgeScore * this.dealWeights.listingAgeScore +
      features.bidCountScore * this.dealWeights.bidCountScore +
      this.dealWeights.bias;

    // Apply sigmoid function to get probability-like output
    return 1 / (1 + Math.exp(-score));
  }

  /**
   * Calculate confidence in the score based on feature completeness
   */
  private calculateConfidence(features: DealFeatures): number {
    // Higher confidence when we have more reliable features
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for reliable seller
    if (features.sellerRating > 0.95) confidence += 0.2;
    
    // Boost confidence for clear price signals
    if (Math.abs(features.priceVsAverage) > 0.3) confidence += 0.15;
    
    // Boost confidence for good title quality
    if (features.titleQualityScore > 0.8) confidence += 0.1;
    
    // Reduce confidence for very low seller ratings
    if (features.sellerRating < 0.9) confidence -= 0.15;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Calculate individual factor scores for explanation
   */
  private calculateFactorScores(features: DealFeatures) {
    return {
      priceScore: Math.round((1 - Math.abs(features.priceVsAverage)) * 100),
      sellerScore: Math.round(features.sellerRating * 100),
      shippingScore: Math.round((1 - features.shippingCostRatio) * 100),
      conditionScore: Math.round(features.conditionScore * 100),
      titleScore: Math.round(features.titleQualityScore * 100),
      freshnessScore: Math.round(features.listingAgeScore * 100)
    };
  }

  /**
   * Get recommendation category based on score
   */
  private getRecommendation(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Normalize price ratio to -1 to 1 scale
   */
  private normalizePriceRatio(price: number, marketAverage: number): number {
    const ratio = price / marketAverage;
    // Convert to -1 to 1 scale where -1 = much cheaper, 1 = much more expensive
    return Math.tanh((ratio - 1) * 2);
  }

  /**
   * Calculate shipping cost ratio
   */
  private calculateShippingRatio(item: EbayItem, itemPrice: number): number {
    if (!item.shippingOptions || item.shippingOptions.length === 0) {
      return 0.5; // Neutral score for unknown shipping
    }

    const shippingCost = parseFloat(item.shippingOptions[0].shippingCost.value);
    if (shippingCost === 0) return 0; // Free shipping = best score

    const ratio = shippingCost / itemPrice;
    return Math.min(1, ratio); // Cap at 1.0
  }

  /**
   * Calculate condition score (0-1 scale)
   */
  private calculateConditionScore(condition: string): number {
    const conditionMap: { [key: string]: number } = {
      'NEW': 1.0,
      'LIKE_NEW': 0.9,
      'EXCELLENT': 0.85,
      'VERY_GOOD': 0.75,
      'GOOD': 0.6,
      'ACCEPTABLE': 0.4,
      'USED': 0.5,
      'REFURBISHED': 0.7,
      'FOR_PARTS_OR_NOT_WORKING': 0.2
    };

    const normalizedCondition = condition.toUpperCase().replace(/\s+/g, '_');
    return conditionMap[normalizedCondition] || 0.5;
  }

  /**
   * Calculate title quality score based on completeness and clarity
   */
  private calculateTitleQuality(title: string): number {
    let score = 0.5; // Base score

    // Length indicators
    if (title.length > 30 && title.length < 120) score += 0.2;
    if (title.length < 20) score -= 0.2;

    // Brand/model indicators
    if (/\b[A-Z][a-z]+ [A-Z0-9]+/g.test(title)) score += 0.15; // Brand Model pattern

    // Condition mentioned
    if (/\b(new|used|refurbished|excellent|good)\b/i.test(title)) score += 0.1;

    // Size/specifications
    if (/\b\d+(\.\d+)?(gb|tb|inch|"|'|mm|cm|oz|lb)\b/i.test(title)) score += 0.1;

    // Avoid spammy indicators
    if (/!!!|wow|amazing|incredible|must see/i.test(title)) score -= 0.15;
    if (title.includes('???')) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get market average price for a category
   */
  private getMarketAverage(category: string, currentPrice: number): number {
    const average = this.marketAverages.get(category);
    if (average) return average;

    // If no market data, use current price as baseline
    return currentPrice * 1.2; // Assume 20% markup as baseline
  }

  /**
   * Initialize market averages (would be loaded from database in production)
   */
  private initializeMarketAverages(): void {
    // Sample market averages for common categories
    this.marketAverages.set('electronics', 250);
    this.marketAverages.set('clothing', 45);
    this.marketAverages.set('books', 15);
    this.marketAverages.set('home', 85);
    this.marketAverages.set('automotive', 150);
    this.marketAverages.set('general', 75);
  }

  /**
   * Update market averages (would be called periodically in production)
   */
  public updateMarketAverages(categoryAverages: Map<string, number>): void {
    categoryAverages.forEach((average, category) => {
      this.marketAverages.set(category, average);
    });
  }
}

// Singleton instance
export const mlDealScoringService = new MLDealScoringService();
