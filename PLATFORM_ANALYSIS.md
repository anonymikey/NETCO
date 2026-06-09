# NETCO Platform Analysis

## Overview
**NETCO** is a premium VPN configuration service platform targeting users in Kenya, providing device-locked VPN configurations for high-speed internet access on major Kenyan networks (Safaricom, Airtel, Telkom).

**Domain:** netco.anonymiketech.online  
**Tech Stack:** React (Vite) + Express.js + PostgreSQL (Drizzle ORM) + Supabase Auth

---

## Architecture Overview

### Monorepo Structure (pnpm Workspace)
```
/workspace
├── artifacts/
│   ├── netco/          (Frontend - React SPA)
│   ├── api-server/     (Backend - Express.js)
│   └── mockup-sandbox/ (Development/Testing)
├── lib/
│   ├── db/             (Database schema + migrations)
│   ├── api-client-react/ (Generated API client)
│   ├── api-spec/       (API specification)
│   └── api-zod/        (Generated Zod schemas)
└── scripts/            (Build & utility scripts)
```

---

## Frontend (artifacts/netco)

### Technology Stack
- **Framework:** React 19.x with Vite
- **Routing:** Wouter (lightweight router)
- **UI Components:** shadcn/ui (Radix UI based) + Tailwind CSS
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Query (@tanstack/react-query)
- **Auth:** Supabase Auth integration
- **Additional Libraries:**
  - `framer-motion` - Animations
  - `recharts` - Data visualization
  - `date-fns` - Date utilities
  - `lucide-react` - Icons
  - `sonner` - Notifications
  - `react-resizable-panels` - Responsive layouts

### Project Structure
```
src/
├── pages/
│   ├── home.tsx             (Landing page)
│   ├── pricing.tsx          (Pricing/Plans)
│   ├── checkout.tsx         (Payment flow)
│   ├── dashboard.tsx        (User dashboard)
│   ├── account.tsx          (Account settings)
│   ├── login.tsx            (Authentication)
│   ├── signup.tsx           (Registration)
│   ├── how-to-connect.tsx   (Instructions)
│   ├── server-status.tsx    (System status)
│   ├── faqs.tsx             (FAQ section)
│   ├── contact.tsx          (Contact form)
│   ├── check-expiry.tsx     (Plan expiry checker)
│   ├── order-status.tsx     (Order tracking)
│   ├── admin.tsx            (Admin dashboard)
│   ├── terms.tsx            (Terms of service)
│   └── not-found.tsx        (404 page)
├── components/
│   ├── layout/              (Navigation, Footer, Layout)
│   ├── sections/            (Page sections - AppShowcase, etc)
│   ├── modals/              (Modals - DownloadHelpModal)
│   ├── notifications/       (NotificationBell)
│   └── ui/                  (shadcn/ui components - 50+ components)
├── contexts/                (React Context - AuthContext)
├── lib/
│   ├── api.ts              (API base URL configuration)
│   └── [other utilities]
├── App.tsx                  (Main router & providers)
└── main.tsx                (Entry point)
```

### Key Features
1. **Authentication:** Supabase Auth-based login/signup with email verification
2. **E-Commerce:** Package selection → Checkout → Order processing
3. **User Dashboard:** View active plans, order history, account settings
4. **Admin Panel:** Analytics, server management, order management, announcements
5. **Information Pages:** How-to guides, FAQs, contact, server status, terms
6. **Plan Management:** Check plan expiry, view plan details

### Routing
- Uses Wouter for client-side routing (lightweight alternative to React Router)
- Protected routes: `/admin`, `/dashboard`, `/account` require authentication
- Admin routes (`/admin`) require `isAdminUser` flag

---

## Backend (artifacts/api-server)

### Technology Stack
- **Framework:** Express.js (v5.x)
- **Language:** TypeScript
- **Database ORM:** Drizzle ORM
- **Authentication:** Supabase Auth
- **Logging:** Pino + Pino HTTP
- **Email:** Resend (email service)
- **File Upload:** Multer
- **Security:** CORS, Cookie Parser

### API Routes
```
/health                        GET   Health check
/auth/email                    POST  Email-based auth
/auth/profile                  GET   Get user profile
/orders                        GET   List user orders
/orders                        POST  Create order
/packages                      GET   List packages
/plans                         GET   List available plans
/payment                       POST  Initiate payment
/contact                       POST  Submit contact form
/stats                         GET   System statistics
/notifications                 GET   Get user notifications
/admin/orders                  *     Manage orders (admin)
/admin/servers                 *     Manage config servers (admin)
/admin/announcements           *     Manage announcements (admin)
```

### Middleware
- **Admin Guard:** Verifies admin privileges for protected routes
- **CORS:** Configured for cross-origin requests
- **Error Handling:** Structured error responses with Pino logging

### Key Services
1. **Authentication:** Email-based auth with Supabase
2. **Order Management:** Create, retrieve, and manage VPN package orders
3. **Payment Processing:** Payment initiation and verification
4. **Package Management:** VPN package configurations for different networks/durations
5. **Email Service:** Send notifications via Resend
6. **Admin Functions:** Server status management, announcements, order management
7. **Statistics:** Dashboard metrics and analytics

---

## Database Schema (lib/db)

### Tables

#### 1. **user_profiles**
User account information, synced with Supabase Auth
```
- id (PK)
- supabaseUid (FK to Supabase Auth)
- email (unique)
- fullName, phone, bio, avatarUrl
- isEmailVerified, isPhoneVerified
- newsletterSubscribed
- timestamps
```

#### 2. **orders**
VPN package purchase orders
```
- id (PK)
- packageId, network, duration, appType
- deviceId (device-locking)
- phone
- amount, status (pending/completed/failed)
- paymentReference, configUrl
- timestamps
```

#### 3. **user_plans**
Active user VPN plans with expiry tracking
```
- id (PK)
- userId, network, appType, duration
- expiryDate
- configuration data
- timestamps
```

#### 4. **config_servers**
VPN server configurations
```
- id (PK)
- name, status, network, appType
- ipAddress, port, credentials
- timestamps
```

#### 5. **contact_messages**
Contact form submissions
```
- id (PK)
- email, name, message, subject
- timestamps
```

#### 6. **notifications**
User notifications/announcements
```
- id (PK)
- userId, type, title, message
- read status
- timestamps
```

### ORM Details
- Uses **Drizzle ORM** for type-safe SQL queries
- **Drizzle Zod** integration for automatic schema validation
- PostgreSQL with timezone support
- Custom hooks: `$onUpdate()` for automatic timestamp updates

---

## API Client Library (lib/api-client-react)

### Purpose
Generated API client for React components to communicate with the backend.

### Generation
- Uses **Orval** code generator for OpenAPI/Swagger specs
- Automatically generates:
  - TypeScript types
  - React Query hooks
  - Request/response interfaces
  - Error handling

### Usage Pattern
```typescript
import { useCreateOrderMutation, useListOrdersQuery } from '@workspace/api-client-react'

// In components:
const { data: orders } = useListOrdersQuery()
const { mutate: createOrder } = useCreateOrderMutation()
```

---

## API Specification (lib/api-spec)

- OpenAPI/Swagger specification for the REST API
- Used to generate client libraries and Zod schemas
- Ensures type safety across frontend and backend

---

## Authentication Flow

### Implementation
1. **Supabase Auth** for user authentication (email/password)
2. **AuthContext** in frontend manages user state and authorization
3. **Admin Role:** `isAdminUser` flag determines admin access

### Protected Routes
```typescript
// AdminRoute component checks:
- User logged in
- User has isAdminUser = true
- Redirects to /login if unauthorized
```

---

## Key Business Logic

### Order/Purchase Flow
1. User selects VPN package (network + duration + app type)
2. Checkout page calculates price based on selected options
3. Payment processing initiated
4. Upon success: Order created, config generated, user plan activated
5. Config URL provided to user for VPN setup

### Plan Management
- Plans have expiry dates
- Users can check plan status and remaining time
- System tracks active/inactive plans
- New orders create/update user plans

### Network Support
- **Safaricom VPN**
- **Airtel VPN**
- **Telkom VPN**

### App Types
- **HTTP Custom Config**
- **HTTP Injector**

### Plan Durations
- Various duration options (weekly, monthly, yearly, etc.)

---

## Development Setup

### Commands
```bash
# Root workspace
pnpm build          # Build all packages
pnpm typecheck      # Type check all packages

# Frontend (artifacts/netco)
pnpm dev            # Start Vite dev server (port 5173 or $PORT)
pnpm build          # Build for production
pnpm serve          # Preview production build
pnpm typecheck      # Check TypeScript

# Backend (artifacts/api-server)
pnpm dev            # Build and start dev server
pnpm build          # Build for production
pnpm start          # Run production build
pnpm typecheck      # Check TypeScript

# Database (lib/db)
pnpm push           # Push schema to database
pnpm push-force     # Force push schema changes
pnpm migrate        # Run migrations
```

### Environment Variables
- **Frontend:** `VITE_API_BASE_URL` (Backend API URL)
- **Backend:** `SUPABASE_URL`, `SUPABASE_KEY`, `DATABASE_URL`, `RESEND_API_KEY`

### Database
- PostgreSQL with Drizzle ORM
- Migrations via Drizzle Kit
- Development: Local or remote database via connection string

---

## Deployment

### Frontend
- Vite-based build
- Static hosting compatible (Vercel, Netlify, etc.)
- Base path support via `BASE_PATH` environment variable

### Backend
- Node.js-based Express server
- Built to `dist/index.mjs`
- Requires environment variables for Supabase, Database, Email service
- Supports any Node.js hosting (Vercel, Railway, etc.)

### Database
- PostgreSQL database (Supabase or self-hosted)
- Drizzle migrations for schema management

---

## Performance & Security Considerations

### Frontend
- React Query for efficient data fetching & caching
- Code splitting via Vite
- Tailwind CSS for optimized styling

### Backend
- Structured logging with Pino
- Admin guard middleware for authorization
- CORS protection
- Input validation via Zod schemas

### Database
- Type-safe queries via Drizzle ORM
- Prepared statements prevent SQL injection
- Timezone-aware timestamps

---

## Admin Features

### Admin Dashboard (`/admin`)
- Requires authenticated user with `isAdminUser = true`
- Access to:
  - **Orders Management:** View/update order statuses
  - **Server Management:** Add/update VPN server configurations
  - **Announcements:** Create/manage system announcements
  - **Statistics:** View system metrics and analytics

---

## Future Enhancement Areas

1. **Payment Gateway Integration:** Currently initiated but could be expanded
2. **Automated Config Generation:** Streamline VPN config creation
3. **Real-time Notifications:** WebSocket support for live updates
4. **Analytics Dashboard:** More detailed usage metrics
5. **Refund Processing:** Automated refund workflows
6. **API Rate Limiting:** Protect against abuse
7. **Multi-language Support:** Localization for different markets
8. **Mobile App:** Native iOS/Android applications

---

## Summary

NETCO is a well-structured, full-stack SaaS platform built with modern technologies:
- **Monorepo architecture** for code sharing and consistency
- **Type-safe development** across frontend and backend
- **Authentication & Authorization** with Supabase
- **Database-driven** with Drizzle ORM
- **API-first approach** with generated clients
- **Admin capabilities** for business operations
- **Production-ready** infrastructure with proper logging and error handling

The platform successfully serves its core purpose: allowing Kenyan users to purchase and activate VPN configurations for major networks.
