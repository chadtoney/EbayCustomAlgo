import { EbayItem, RankedItem, UserPreferences } from '@/types/ebay';

/**
 * Custom ranking algorithm for eBay search results
 * Ranks items based on user preferences and custom scoring logic
 */
export class EbayRankingEngine {
  /**
   * Rank and filter eBay items based on user preferences
   */
  static rankItems(items: EbayItem[], preferences: UserPreferences): RankedItem[] {
    return items
      .map(item => this.calculateRelevanceScore(item, preferences))
      .filter(item => item.relevanceScore > 0) // Filter out items that don't meet criteria
      .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance score descending
  }

  /**
   * Calculate relevance score for a single item
   */
  private static calculateRelevanceScore(item: EbayItem, preferences: UserPreferences): RankedItem {
    const priceScore = this.calculatePriceScore(item, preferences.maxPrice);
    const conditionScore = this.calculateConditionScore(item, preferences.preferredCondition);
    const sellerScore = this.calculateSellerScore(item, preferences.minimumSellerRating);
    const shippingScore = this.calculateShippingScore(item, preferences.freeShippingOnly);
    const keywordScore = this.calculateKeywordScore(item, preferences.keywords);

    // Weighted average of all scores
    const weights = {
      price: 0.25,
      condition: 0.15,
      seller: 0.20,
      shipping: 0.15,
      keyword: 0.25
    };

    const relevanceScore = 
      (priceScore * weights.price) +
      (conditionScore * weights.condition) +
      (sellerScore * weights.seller) +
      (shippingScore * weights.shipping) +
      (keywordScore * weights.keyword);

    return {
      ...item,
      relevanceScore: Math.round(relevanceScore * 100) / 100, // Round to 2 decimal places
      rankingFactors: {
        priceScore,
        conditionScore,
        sellerScore,
        shippingScore,
        keywordScore
      }
    };
  }

  /**
   * Calculate price score (0-100)
   * Higher score for items within budget, lower score for expensive items
   */
  private static calculatePriceScore(item: EbayItem, maxPrice?: number): number {
    if (!maxPrice) return 50; // Neutral score if no price preference

    const itemPrice = parseFloat(item.price.value);
    if (itemPrice > maxPrice) return 0; // Exclude items over budget

    // Linear scoring: items at 0% of budget get 100, items at 100% get 50
    const priceRatio = itemPrice / maxPrice;
    return Math.max(0, 100 - (priceRatio * 50));
  }

  /**
   * Calculate condition score (0-100)
   */
  private static calculateConditionScore(item: EbayItem, preferredConditions?: string[]): number {
    if (!preferredConditions || preferredConditions.length === 0) return 50; // Neutral score

    const itemCondition = item.condition.toUpperCase();
    if (preferredConditions.map(c => c.toUpperCase()).includes(itemCondition)) {
      return 100;
    }

    // Partial matches for similar conditions
    if (itemCondition.includes('NEW') && preferredConditions.some(c => c.toUpperCase().includes('NEW'))) {
      return 80;
    }
    if (itemCondition.includes('USED') && preferredConditions.some(c => c.toUpperCase().includes('USED'))) {
      return 60;
    }

    return 20; // Low score for non-preferred conditions
  }

  /**
   * Calculate seller score (0-100)
   */
  private static calculateSellerScore(item: EbayItem, minimumRating?: number): number {
    if (!minimumRating) return 50; // Neutral score

    const sellerRating = item.seller.feedbackPercentage;
    if (sellerRating < minimumRating) return 0; // Exclude sellers below minimum

    // Score based on how much above minimum the seller is
    const ratingBonus = Math.min((sellerRating - minimumRating) * 2, 50);
    return Math.min(100, 50 + ratingBonus);
  }

  /**
   * Calculate shipping score (0-100)
   */
  private static calculateShippingScore(item: EbayItem, freeShippingOnly?: boolean): number {
    if (!freeShippingOnly) return 50; // Neutral score if shipping preference not specified

    const hasFreeShipping = item.shippingOptions?.some(option => 
      parseFloat(option.shippingCost.value) === 0
    );

    return hasFreeShipping ? 100 : 0;
  }

  /**
   * Calculate keyword relevance score (0-100)
   */
  private static calculateKeywordScore(item: EbayItem, keywords?: string[]): number {
    if (!keywords || keywords.length === 0) return 50; // Neutral score

    const itemText = (item.title + ' ' + (item.shortDescription || '')).toLowerCase();
    let matchCount = 0;

    keywords.forEach(keyword => {
      if (itemText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    });

    // Score based on percentage of keywords matched
    return Math.min(100, (matchCount / keywords.length) * 100);
  }

  /**
   * Get explanation for why an item was ranked a certain way
   */
  static getScoreExplanation(rankedItem: RankedItem): string {
    const factors = rankedItem.rankingFactors;
    const explanations: string[] = [];

    if (factors.priceScore > 70) explanations.push('Great price value');
    else if (factors.priceScore < 30) explanations.push('Higher priced');

    if (factors.conditionScore > 70) explanations.push('Preferred condition');
    else if (factors.conditionScore < 30) explanations.push('Condition not preferred');

    if (factors.sellerScore > 70) explanations.push('Excellent seller rating');
    else if (factors.sellerScore < 30) explanations.push('Lower seller rating');

    if (factors.shippingScore > 70) explanations.push('Free shipping available');
    else if (factors.shippingScore === 0) explanations.push('No free shipping');

    if (factors.keywordScore > 70) explanations.push('High keyword relevance');
    else if (factors.keywordScore < 30) explanations.push('Low keyword match');

    return explanations.join(', ') || 'Standard match';
  }
}
