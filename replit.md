# Overview

This is a full-stack podcast timeline application built for the "Regulation Podcast". It displays episodes in a chronological timeline format with support for both full episodes and bonus content. The application fetches and parses RSS feed data to automatically populate episode information, providing a clean and interactive way to browse podcast episodes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular design with separate components for timeline header, filters, content, and episode cards

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for episode management and RSS feed processing
- **Data Validation**: Zod schemas for type-safe data validation
- **Storage Layer**: Abstracted storage interface supporting both in-memory and database implementations
- **RSS Processing**: Custom RSS feed parser for extracting podcast episode metadata

## Data Storage Solutions
- **ORM**: Drizzle ORM with PostgreSQL dialect configuration
- **Database**: PostgreSQL (configured via Neon serverless driver)
- **Schema Management**: Drizzle migrations with schema definitions in shared directory
- **Data Models**: Episodes and users tables with proper indexing and relationships
- **Storage Abstraction**: Interface-based storage layer allowing for multiple implementations (memory, database)

## External Dependencies
- **Database Provider**: Neon Database (PostgreSQL serverless)
- **RSS Feed Source**: External podcast RSS feeds for episode data synchronization
- **UI Components**: Radix UI primitives for accessible component foundation
- **Build Tools**: Vite for frontend bundling, ESBuild for backend compilation
- **Development Tools**: Replit-specific plugins for development environment integration

## Key Architectural Decisions

### Monorepo Structure
The application uses a shared TypeScript codebase with separate `client`, `server`, and `shared` directories. This enables type sharing between frontend and backend while maintaining clear separation of concerns.

### Database-First Approach
Uses Drizzle ORM with schema-first design, allowing for type-safe database operations and automatic TypeScript type generation from database schemas.

### Component-Based UI
Leverages a comprehensive component library built on Radix UI primitives, providing consistent design patterns and accessibility features throughout the application.

### Server-Side RSS Processing
Episodes are fetched and processed server-side from RSS feeds, with parsed data stored in the database for fast retrieval and offline browsing capabilities.

### Flexible Storage Layer
Implements an abstracted storage interface that supports both in-memory storage (for development) and PostgreSQL (for production), enabling easy testing and deployment flexibility.