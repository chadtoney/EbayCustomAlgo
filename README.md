# 🛒 Personal eBay Shopping Agent

A full-stack web application that searches eBay listings using **custom user-defined criteria** instead of eBay's default recommendation algorithm. The app allows users to input preferences and returns a ranked list of relevant eBay listings based on intelligent scoring.

## ✨ Features

- **Custom Search Form**: Input keywords, price range, condition, seller rating preferences
- **Intelligent Ranking**: Custom algorithm that scores items based on user preferences
- **eBay API Integration**: Uses eBay Browse API to fetch real listing data
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Search**: Fast API responses with loading states
- **Detailed Results**: Shows item images, prices, seller info, and ranking explanations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- eBay Developer Account (for API credentials)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # eBay API Configuration
   EBAY_CLIENT_ID=your_ebay_client_id_here
   EBAY_CLIENT_SECRET=your_ebay_client_secret_here
   EBAY_REDIRECT_URI=http://localhost:3000/api/auth/callback

   # Optional: OpenAI API for semantic search
   OPENAI_API_KEY=your_openai_api_key_here

   # Next.js Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Get eBay API Credentials**:
   - Visit [eBay Developers Program](https://developer.ebay.com/)
   - Create a new application
   - Get your Client ID and Client Secret
   - Add them to your `.env.local` file

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/search/          # eBay search API endpoint
│   ├── page.tsx             # Main application page
│   └── layout.tsx           # App layout
├── components/
│   ├── SearchForm.tsx       # Search form component
│   └── SearchResults.tsx    # Results display component
├── lib/
│   ├── ebay-api.ts         # eBay API client
│   └── ranking-engine.ts    # Custom ranking algorithm
└── types/
    └── ebay.ts             # TypeScript type definitions
```

## 🔧 How It Works

### 1. Search Process
1. User fills out the search form with criteria
2. Frontend sends request to `/api/search` endpoint
3. Backend calls eBay Browse API with search parameters
4. Custom ranking algorithm scores each item
5. Results are sorted by relevance score and returned

### 2. Ranking Algorithm
The custom ranking engine scores items based on:

- **Price Score (25%)**: Preference for items within budget
- **Condition Score (15%)**: Matches user's preferred item conditions
- **Seller Score (20%)**: Seller rating and feedback percentage
- **Shipping Score (15%)**: Free shipping preference
- **Keyword Score (25%)**: Relevance to search terms

### 3. API Integration
- Uses eBay Browse API (Sandbox environment by default)
- OAuth2 authentication with client credentials flow
- Rate limiting and error handling included
- Supports filtering by price, condition, shipping, etc.

## 🎯 Usage

1. **Enter Search Criteria**:
   - Keywords (required)
   - Price range (optional)
   - Item condition preference
   - Minimum seller rating
   - Free shipping preference
   - Buy It Now only option

2. **View Ranked Results**:
   - Items sorted by custom relevance score
   - See why each item was ranked at its position
   - Click to view item on eBay

3. **Customize Preferences**:
   - Adjust form fields to change ranking priorities
   - Results update automatically with new searches

## 🛠️ Built With

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **External APIs**: eBay Browse API
- **Authentication**: OAuth2 (eBay API)
- **Styling**: Tailwind CSS

## 📝 Environment Setup

### Development (Sandbox)
The application is configured to use eBay's sandbox environment by default. This allows testing without real transactions.

### Production
To use the production eBay API:
1. Change API endpoints from `api.sandbox.ebay.com` to `api.ebay.com`
2. Update marketplace IDs as needed
3. Ensure production API credentials are configured

## 🔮 Future Enhancements

- **User Accounts**: Save search preferences and favorite items
- **Email Notifications**: Daily alerts for new items matching criteria
- **Machine Learning**: Improve ranking based on user interactions
- **OpenAI Integration**: Semantic search using embeddings
- **Price Tracking**: Monitor price changes for watched items
- **Comparison Tool**: Side-by-side item comparisons

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
