# Copilot Instructions for eBay Shopping Agent

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Personal eBay Shopping Agent web application built with Next.js and TypeScript. The app allows users to search eBay listings using custom user-defined criteria instead of eBay's default recommendation algorithm.

## Key Features
- Frontend: React-based UI with search form and results display
- Backend: Next.js API routes for eBay API integration
- Custom filtering and ranking logic for search results
- eBay Browse API integration with OAuth2
- Optional: OpenAI embeddings for semantic search

## Tech Stack
- Frontend: Next.js 15 with React, TypeScript, Tailwind CSS
- Backend: Next.js API routes
- External APIs: eBay Browse API, Optional OpenAI API
- Styling: Tailwind CSS for responsive design

## Development Guidelines
- Use TypeScript for all code
- Follow Next.js App Router patterns
- Implement proper error handling for API calls
- Use environment variables for API keys and sensitive data
- Create reusable components for UI elements
- Implement proper loading states and user feedback
- Follow responsive design principles with Tailwind CSS

## API Integration Notes
- eBay APIs require OAuth2 authentication
- Implement rate limiting and caching for API calls
- Handle API errors gracefully with user-friendly messages
- Store API credentials securely in environment variables

## Code Organization
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and API clients
- `/src/types` - TypeScript type definitions
- `/src/app/api` - Next.js API routes for backend logic
