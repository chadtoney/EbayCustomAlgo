import { EbayItem, RankedItem, UserPreferences } from '@/types/ebay';
import { azureOpenAIService, AzureOpenAIEmbeddingService } from './azure-openai-service';
import { mlDealScoringService, DealScore } from './ml-deal-scoring';

/**
 * Enhanced AI + ML Ranking Engine for eBay Search Results
 * Combines semantic understanding (Azure OpenAI) with traditional ML deal scoring
 * 
 * Features:
 * 1. Semantic similarity using Azure OpenAI embeddings
 * 2. Traditional ML deal quality scoring
 * 3. Combined ranking algorithm
 * 4. Explainable AI results
 */

export interface EnhancedRankedItem extends RankedItem {
  semanticScore?: number;           // 0-100, semantic similarity to user query
  dealScore?: DealScore;           // ML-based deal quality assessment
  aiRankingFactors: {
    semanticSimilarity: number;     // How well item matches user intent
    dealQuality: number;           // ML-assessed deal quality
    traditionalRelevance: number;  // Original ranking factors
    finalScore: number;            // Combined AI + ML score
  };
  explanation: {
    semanticReason?: string;       // Why semantically relevant
    dealReason: string;           // Why good/bad deal
    overallReason: string;        // Combined explanation
  };
}

/**
 * Enhanced Ranking Engine with AI and ML capabilities
 */
export class EnhancedEbayRankingEngine {
  
  /**
   * Rank eBay items using AI semantic understanding and ML deal scoring
   */
  static async rankItemsWithAI(
    items: EbayItem[], 
    preferences: UserPreferences,
    userQuery?: string
  ): Promise<EnhancedRankedItem[]> {
    console.log('🧠 Starting AI-enhanced ranking...');
    
    try {
      // Step 1: Generate traditional ranking scores
      const traditionalRanked = this.getTraditionalRanking(items, preferences);
      
      // Step 2: Generate semantic embeddings if Azure OpenAI is available
      let semanticScores: (number | null)[] = [];
      if (userQuery && azureOpenAIService.isAvailable()) {
        semanticScores = await this.calculateSemanticScores(items, userQuery);
      }
      
      // Step 3: Generate ML deal scores
      const dealScores = mlDealScoringService.scoreBatchDeals(items);
      
      // Step 4: Combine all scores into final ranking
      const enhancedItems = traditionalRanked.map((item, index) => 
        this.combineScores(item, semanticScores[index], dealScores[index])
      );
      
      // Step 5: Sort by final combined score
      const finalRanked = enhancedItems.sort((a, b) => 
        b.aiRankingFactors.finalScore - a.aiRankingFactors.finalScore
      );
      
      console.log('✅ AI-enhanced ranking complete');
      return finalRanked;
      
    } catch (error) {
      console.error('❌ Error in AI ranking, falling back to traditional:', error);
      
      // Fallback to traditional ranking if AI fails
      return this.fallbackToTraditional(items, preferences);
    }
  }

  /**
   * Calculate semantic similarity scores using Azure OpenAI embeddings
   */
  private static async calculateSemanticScores(
    items: EbayItem[], 
    userQuery: string
  ): Promise<(number | null)[]> {
    try {
      console.log('🔍 Calculating semantic similarities...');
      
      // Generate embedding for user query
      const queryEmbedding = await azureOpenAIService.generateEmbedding(userQuery);
      if (!queryEmbedding) {
        console.warn('Failed to generate query embedding');
        return items.map(() => null);
      }
      
      // Generate embeddings for all item descriptions
      const itemTexts = items.map(item => 
        `${item.title} ${item.shortDescription || ''}`
      );
      
      const itemEmbeddings = await azureOpenAIService.generateBatchEmbeddings(itemTexts);
      
      // Calculate cosine similarities
      const similarities = itemEmbeddings.map(embedding => {
        if (!embedding) return null;
        
        try {
          const similarity = AzureOpenAIEmbeddingService.calculateCosineSimilarity(
            queryEmbedding, 
            embedding
          );
          
          // Convert to 0-100 scale
          return Math.max(0, Math.min(100, (similarity + 1) * 50));
        } catch (error) {
          console.warn('Error calculating similarity:', error);
          return null;
        }
      });
      
      console.log(`✅ Calculated ${similarities.filter(s => s !== null).length}/${items.length} semantic scores`);
      return similarities;
      
    } catch (error) {
      console.error('Error calculating semantic scores:', error);
      return items.map(() => null);
    }
  }

  /**
   * Get traditional ranking scores (existing algorithm)
   */
  private static getTraditionalRanking(
    items: EbayItem[], 
    preferences: UserPreferences
  ): RankedItem[] {
    // Use the existing ranking algorithm
    return items.map(item => {
      const priceScore = this.calculatePriceScore(item, preferences.maxPrice);
      const conditionScore = this.calculateConditionScore(item, preferences.preferredCondition);
      const sellerScore = this.calculateSellerScore(item, preferences.minimumSellerRating);
      const shippingScore = this.calculateShippingScore(item, preferences.freeShippingOnly);
      const keywordScore = this.calculateKeywordScore(item, preferences.keywords);

      const weights = { price: 0.25, condition: 0.15, seller: 0.20, shipping: 0.15, keyword: 0.25 };
      const relevanceScore = 
        (priceScore * weights.price) +
        (conditionScore * weights.condition) +
        (sellerScore * weights.seller) +
        (shippingScore * weights.shipping) +
        (keywordScore * weights.keyword);

      return {
        ...item,
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        rankingFactors: { priceScore, conditionScore, sellerScore, shippingScore, keywordScore }
      };
    });
  }

  /**
   * Combine semantic, deal, and traditional scores into final ranking
   */
  private static combineScores(
    traditionalItem: RankedItem,
    semanticScore: number | null,
    dealScore: DealScore
  ): EnhancedRankedItem {
    
    // Weights for different scoring components
    const weights = {
      semantic: 0.35,      // Semantic understanding (most important for user intent)
      dealQuality: 0.35,   // ML deal quality assessment
      traditional: 0.30    // Original relevance factors
    };

    // Normalize scores to 0-100 scale
    const normalizedTraditional = traditionalItem.relevanceScore;
    const normalizedSemantic = semanticScore || 50; // Default to neutral if no semantic score
    const normalizedDeal = dealScore.overallScore;

    // Calculate final combined score
    const finalScore = 
      (normalizedSemantic * weights.semantic) +
      (normalizedDeal * weights.dealQuality) +
      (normalizedTraditional * weights.traditional);

    // Generate explanations
    const explanation = this.generateExplanation(
      normalizedSemantic,
      dealScore,
      traditionalItem
    );

    return {
      ...traditionalItem,
      semanticScore: semanticScore || undefined,
      dealScore,
      aiRankingFactors: {
        semanticSimilarity: Math.round(normalizedSemantic * 100) / 100,
        dealQuality: Math.round(normalizedDeal * 100) / 100,
        traditionalRelevance: Math.round(normalizedTraditional * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100
      },
      explanation,
      relevanceScore: finalScore // Update overall relevance score
    };
  }

  /**
   * Generate human-readable explanations for ranking decisions
   */
  private static generateExplanation(
    semanticScore: number,
    dealScore: DealScore,
    traditionalItem: RankedItem
  ) {
    // Semantic reasoning
    let semanticReason = '';
    if (semanticScore >= 75) {
      semanticReason = 'Highly relevant to your search intent';
    } else if (semanticScore >= 60) {
      semanticReason = 'Good match for your search intent';
    } else if (semanticScore >= 40) {
      semanticReason = 'Somewhat relevant to your search';
    } else {
      semanticReason = 'Limited relevance to your search intent';
    }

    // Deal quality reasoning
    const dealReason = this.getDealExplanation(dealScore);

    // Traditional factors
    const traditionalFactors: string[] = [];
    if (traditionalItem.rankingFactors.priceScore > 70) traditionalFactors.push('great price');
    if (traditionalItem.rankingFactors.sellerScore > 80) traditionalFactors.push('excellent seller');
    if (traditionalItem.rankingFactors.shippingScore > 80) traditionalFactors.push('free shipping');
    if (traditionalItem.rankingFactors.keywordScore > 70) traditionalFactors.push('keyword match');

    // Combine overall reasoning
    let overallReason = '';
    if (semanticScore >= 70 && dealScore.overallScore >= 70) {
      overallReason = 'Excellent match: highly relevant and great deal quality';
    } else if (semanticScore >= 60 || dealScore.overallScore >= 70) {
      overallReason = 'Good option: ' + (semanticScore >= 60 ? 'relevant to your needs' : 'attractive deal');
    } else {
      overallReason = 'Consider carefully: ' + (semanticScore < 40 ? 'limited relevance' : 'fair deal quality');
    }

    if (traditionalFactors.length > 0) {
      overallReason += ` (${traditionalFactors.join(', ')})`;
    }

    return {
      semanticReason: semanticScore ? semanticReason : undefined,
      dealReason,
      overallReason
    };
  }

  /**
   * Generate explanation for deal quality score
   */
  private static getDealExplanation(dealScore: DealScore): string {
    const factors: string[] = [];
    
    if (dealScore.factors.priceScore > 75) factors.push('competitive pricing');
    if (dealScore.factors.sellerScore > 85) factors.push('trusted seller');
    if (dealScore.factors.shippingScore > 80) factors.push('low shipping cost');
    if (dealScore.factors.conditionScore > 80) factors.push('good condition');

    const baseExplanation = `${dealScore.recommendation} deal (${dealScore.overallScore}% quality)`;
    
    if (factors.length > 0) {
      return `${baseExplanation}: ${factors.join(', ')}`;
    }
    
    return baseExplanation;
  }

  /**
   * Fallback to traditional ranking if AI services fail
   */
  private static fallbackToTraditional(
    items: EbayItem[], 
    preferences: UserPreferences
  ): EnhancedRankedItem[] {
    console.log('⚠️ Falling back to traditional ranking');
    
    const traditionalRanked = this.getTraditionalRanking(items, preferences);
    const dealScores = mlDealScoringService.scoreBatchDeals(items);
    
    return traditionalRanked.map((item, index) => ({
      ...item,
      dealScore: dealScores[index],
      aiRankingFactors: {
        semanticSimilarity: 50, // Neutral semantic score
        dealQuality: dealScores[index].overallScore,
        traditionalRelevance: item.relevanceScore,
        finalScore: (item.relevanceScore + dealScores[index].overallScore) / 2
      },
      explanation: {
        dealReason: this.getDealExplanation(dealScores[index]),
        overallReason: 'Ranked using traditional factors and deal quality assessment'
      }
    }));
  }

  // Traditional scoring methods (from original ranking engine)
  private static calculatePriceScore(item: EbayItem, maxPrice?: number): number {
    if (!maxPrice) return 50;
    const itemPrice = parseFloat(item.price.value);
    if (itemPrice > maxPrice) return 0;
    const priceRatio = itemPrice / maxPrice;
    return Math.max(0, 100 - (priceRatio * 50));
  }

  private static calculateConditionScore(item: EbayItem, preferredConditions?: string[]): number {
    if (!preferredConditions || preferredConditions.length === 0) return 50;
    const itemCondition = item.condition.toUpperCase();
    if (preferredConditions.map(c => c.toUpperCase()).includes(itemCondition)) return 100;
    if (itemCondition.includes('NEW') && preferredConditions.some(c => c.toUpperCase().includes('NEW'))) return 80;
    if (itemCondition.includes('USED') && preferredConditions.some(c => c.toUpperCase().includes('USED'))) return 60;
    return 20;
  }

  private static calculateSellerScore(item: EbayItem, minimumRating?: number): number {
    if (!minimumRating) return 50;
    const sellerRating = item.seller.feedbackPercentage;
    if (sellerRating < minimumRating) return 0;
    const ratingBonus = Math.min((sellerRating - minimumRating) * 2, 50);
    return Math.min(100, 50 + ratingBonus);
  }

  private static calculateShippingScore(item: EbayItem, freeShippingOnly?: boolean): number {
    if (!freeShippingOnly) return 50;
    const hasFreeShipping = item.shippingOptions?.some(option => 
      parseFloat(option.shippingCost.value) === 0
    );
    return hasFreeShipping ? 100 : 0;
  }

  private static calculateKeywordScore(item: EbayItem, keywords?: string[]): number {
    if (!keywords || keywords.length === 0) return 50;
    const itemText = (item.title + ' ' + (item.shortDescription || '')).toLowerCase();
    let matchCount = 0;
    keywords.forEach(keyword => {
      if (itemText.includes(keyword.toLowerCase())) matchCount++;
    });
    return Math.min(100, (matchCount / keywords.length) * 100);
  }
}
