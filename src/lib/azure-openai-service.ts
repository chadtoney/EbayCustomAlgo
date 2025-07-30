import OpenAI from 'openai';
import { DefaultAzureCredential } from '@azure/identity';

/**
 * Azure OpenAI Embedding Service
 * Provides semantic understanding using Azure OpenAI text embeddings
 * Follows Azure best practices with managed identity and secure configuration
 * Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/embeddings
 */
export class AzureOpenAIEmbeddingService {
  private client: OpenAI | null = null;
  private deploymentName: string;
  private isConfigured: boolean = false;

  constructor() {
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'text-embedding-ada-002';
    this.initializeClient();
  }

  /**
   * Initialize Azure OpenAI client with best practices
   * Uses Managed Identity in Azure environments, API key for local development
   */
  private async initializeClient(): Promise<void> {
    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';

      if (!endpoint) {
        console.warn('Azure OpenAI endpoint not configured. Semantic search will be disabled.');
        return;
      }

      // Use Managed Identity in Azure environments, API key for local development
      if (process.env.NODE_ENV === 'production' && !apiKey) {
        // Production: Use Managed Identity (best practice for Azure-hosted apps)
        try {
          const credential = new DefaultAzureCredential();
          const token = await credential.getToken('https://cognitiveservices.azure.com/.default');
          
          this.client = new OpenAI({
            apiKey: token.token,
            baseURL: `${endpoint}/openai/deployments/${this.deploymentName}`,
            defaultQuery: { 'api-version': apiVersion },
            defaultHeaders: {
              'Authorization': `Bearer ${token.token}`,
            },
          });
          console.log('Azure OpenAI initialized with Managed Identity');
        } catch (credentialError) {
          console.error('Failed to get managed identity token:', credentialError);
          return;
        }
      } else if (apiKey) {
        // Development: Use API key (when managed identity is not available)
        this.client = new OpenAI({
          apiKey,
          baseURL: `${endpoint}/openai/deployments/${this.deploymentName}`,
          defaultQuery: { 'api-version': apiVersion },
        });
        console.log('Azure OpenAI initialized with API key');
      } else {
        console.warn('Azure OpenAI credentials not found. Semantic search will be disabled.');
        return;
      }

      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to initialize Azure OpenAI client:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate embeddings for text using Azure OpenAI
   * Implements retry logic and error handling as per Azure best practices
   */
  public async generateEmbedding(text: string, retryCount = 0): Promise<number[] | null> {
    if (!this.isConfigured || !this.client) {
      console.warn('Azure OpenAI not configured. Skipping embedding generation.');
      return null;
    }

    try {
      // Clean and truncate text for embedding (max ~8000 tokens for ada-002)
      const cleanText = this.preprocessText(text);
      
      if (!cleanText.trim()) {
        console.warn('Empty text provided for embedding');
        return null;
      }

      const response = await this.client.embeddings.create({
        model: this.deploymentName,
        input: cleanText,
      });
      
      if (response.data && response.data.length > 0) {
        return response.data[0].embedding;
      } else {
        console.warn('No embedding data received from Azure OpenAI');
        return null;
      }
    } catch (error: unknown) {
      console.error('Error generating embedding:', error);

      // Implement retry logic for transient failures
      if (retryCount < 3 && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying embedding generation in ${delay}ms (attempt ${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateEmbedding(text, retryCount + 1);
      }

      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * Optimizes API calls and handles rate limiting
   */
  public async generateBatchEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.isConfigured || !this.client) {
      console.warn('Azure OpenAI not configured. Skipping batch embedding generation.');
      return texts.map(() => null);
    }

    try {
      // Process in batches to respect API limits
      const batchSize = 16; // Azure OpenAI supports up to 16 inputs per request
      const results: (number[] | null)[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const cleanBatch = batch.map(text => this.preprocessText(text)).filter(text => text.trim());

        if (cleanBatch.length === 0) {
          results.push(...Array(batch.length).fill(null));
          continue;
        }

        try {
          const response = await this.client.embeddings.create({
            model: this.deploymentName,
            input: cleanBatch,
          });
          
          if (response.data) {
            const embeddings = response.data.map((item: { embedding: number[] }) => item.embedding);
            results.push(...embeddings);
            
            // Pad with nulls if some texts were filtered out
            while (results.length < i + batch.length) {
              results.push(null);
            }
          } else {
            results.push(...Array(batch.length).fill(null));
          }
        } catch (batchError) {
          console.error('Error in batch embedding generation:', batchError);
          results.push(...Array(batch.length).fill(null));
        }

        // Rate limiting: small delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batch embedding generation:', error);
      return texts.map(() => null);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  public static calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Preprocess text for embedding generation
   * Cleans and truncates text to fit model limits
   */
  private preprocessText(text: string): string {
    // Remove extra whitespace and normalize
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Truncate to reasonable length (approximately 6000 characters for ada-002)
    if (cleaned.length > 6000) {
      cleaned = cleaned.substring(0, 6000);
    }

    return cleaned;
  }

  /**
   * Check if an error is retryable (transient)
   */
  private isRetryableError(error: unknown): boolean {
    // Rate limit, network errors, and temporary server errors are retryable
    const retryableCodes = [429, 500, 502, 503, 504];
    const statusCode = (error as any)?.response?.status || (error as any)?.status;
    
    return retryableCodes.includes(statusCode) || 
           (error as any)?.code === 'ENOTFOUND' || 
           (error as any)?.code === 'ECONNRESET';
  }
}

// Singleton instance
export const azureOpenAIService = new AzureOpenAIEmbeddingService();
