# Performance Platform

A modern, full-stack performance review management system built with Next.js. This platform streamlines the employee performance review process with customizable templates, role-based workflows, and comprehensive reporting capabilities.

## Features

### Core Functionality
- **Custom Review Templates** - Build and manage flexible review forms with sections and questions
- **Role-Based Workflows** - Separate interfaces and permissions for HR, Managers, and Employees
- **360-Degree Reviews** - Collect both self-assessments and manager evaluations
- **Performance Tracking** - Visual dashboards with performance charts and historical data
- **PDF Export** - Generate professional PDF reports of completed reviews
- **Email Notifications** - Automated notifications for review assignments and status updates
- **Team Management** - Hierarchical organization structure with manager-employee relationships

### User Roles
- **HR** - Create templates, initiate reviews, view all team members
- **Manager** - Complete manager evaluations, view team performance
- **Employee** - Complete self-assessments, view personal review history

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM
- **SQLite** - Database (development)
- **NextAuth.js** - Authentication system

### Additional Tools
- **jsPDF** - PDF generation
- **Resend** - Email delivery
- **date-fns** - Date manipulation

## Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd performance-platform
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Authentication Provider (configure as needed)
# Add your OAuth provider credentials here
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Database Setup

Initialize the database and run migrations:

```bash
npx prisma generate
npx prisma db push
```

**Optional: Seed the database with sample data:**
```bash
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
performance-platform/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── actions/          # Server actions
│   │   ├── api/              # API routes
│   │   ├── builder/          # Template builder pages
│   │   ├── dashboard/        # Dashboard page
│   │   ├── login/            # Authentication pages
│   │   ├── reviews/          # Review management pages
│   │   └── team/             # Team management pages
│   ├── components/           # React components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts           # Auth utilities
│   │   ├── email.ts          # Email utilities
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # General utilities
│   ├── types/                # TypeScript type definitions
│   └── auth.ts               # NextAuth configuration
├── .gitignore
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Database Schema

### Key Models

- **User** - System users with roles (HR, MANAGER, EMPLOYEE)
- **FormTemplate** - Customizable review templates
- **FormSection** - Sections within templates
- **FormQuestion** - Individual questions with role-based visibility
- **PerformanceReview** - Review instances with status tracking
- **ReviewResponse** - Individual question responses (self + manager ratings)

## Development Workflow

### Creating Review Templates

1. Navigate to the template builder
2. Add sections and questions
3. Configure role-based question visibility
4. Save and activate the template

### Conducting Reviews

1. **HR/Manager** - Create new review and assign to employee
2. **Employee** - Complete self-assessment with ratings and comments
3. **Manager** - Review employee's self-assessment and add manager ratings
4. **Both** - View completed review and export as PDF

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Database Management

```bash
npx prisma studio           # Open Prisma Studio (database GUI)
npx prisma generate         # Regenerate Prisma Client
npx prisma db push          # Push schema changes to database
npx prisma migrate dev      # Create and apply migrations
```

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy

### Environment Variables for Production

Ensure these are set in your production environment:
- `DATABASE_URL` - Production database connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Secure random string
- `RESEND_API_KEY` - Email service API key

### Database Migration

For production, use a more robust database:
- PostgreSQL (recommended)
- MySQL
- SQL Server

Update the `datasource` in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and confidential.

## Support

For issues and questions, please open an issue in the repository.
