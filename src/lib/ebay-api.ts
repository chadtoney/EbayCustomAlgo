import axios from 'axios';
import { EbaySearchCriteria, EbayItem } from '@/types/ebay';

class EbayAPIClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID || '';
    this.clientSecret = process.env.EBAY_CLIENT_SECRET || '';
  }

  /**
   * Get OAuth2 access token for eBay API
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 90% of actual expiry to refresh before it expires
      this.tokenExpiry = Date.now() + (response.data.expires_in * 900);
      
      return this.accessToken!;
    } catch (error) {
      console.error('Error getting eBay access token:', error);
      throw new Error('Failed to authenticate with eBay API');
    }
  }

  /**
   * Search eBay items using the Browse API
   */
  async searchItems(criteria: EbaySearchCriteria, limit: number = 50): Promise<EbayItem[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', criteria.keywords);
      params.append('limit', limit.toString());

      if (criteria.categoryId) {
        params.append('category_ids', criteria.categoryId);
      }

      // Build filter string
      const filters: string[] = [];
      
      if (criteria.minPrice || criteria.maxPrice) {
        const priceFilter = `price:[${criteria.minPrice || ''}..${criteria.maxPrice || ''}]`;
        filters.push(priceFilter);
      }

      if (criteria.condition) {
        filters.push(`conditions:{${criteria.condition}}`);
      }

      if (criteria.freeShipping) {
        filters.push('deliveryOptions:{FAST_N_FREE}');
      }

      if (criteria.buyItNow) {
        filters.push('buyingOptions:{FIXED_PRICE}');
      }

      if (filters.length > 0) {
        params.append('filter', filters.join(','));
      }

      if (criteria.sortOrder) {
        params.append('sort', criteria.sortOrder);
      }

      const response = await axios.get(
        `https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            'Accept': 'application/json',
          },
        }
      );

      return response.data.itemSummaries || [];
    } catch (error) {
      console.error('Error searching eBay items:', error);
      throw new Error('Failed to search eBay items');
    }
  }

  /**
   * Get item details by item ID
   */
  async getItemDetails(itemId: string): Promise<EbayItem | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.sandbox.ebay.com/buy/browse/v1/item/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting eBay item details:', error);
      return null;
    }
  }
}

export const ebayAPI = new EbayAPIClient();
