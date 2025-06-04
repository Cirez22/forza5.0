# FORZA

A minimalist black and white React application with Supabase integration.

## Features

- User authentication (register, login, logout)
- Minimalist black and white UI design
- Responsive layout for all devices
- Well-structured project organization
- Supabase integration for backend services

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example` and add your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/context` - React context providers
- `/src/pages` - Main application pages
- `/src/services` - API and service integrations
- `/supabase/migrations` - Database migrations for Supabase

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Supabase
- React Router
- Lucide React (for icons)