# EstateHub - Estate Management System

A comprehensive, modern estate management platform designed to streamline operations for residential estates, property managers, and residents. EstateHub provides a centralized solution for managing bills, transactions, meters, visitors, and user administration across multiple estates.

## 🌐 Live URLs

- **Production**: [https://berta-hub-app.vercel.app/](https://berta-hub-app.vercel.app/)
- **Development**: [https://dev-bertahub.vercel.app/](https://dev-bertahub.vercel.app/)

## ✨ Features

### 🏢 Multi-Role System

EstateHub supports four distinct user roles, each with tailored functionality:

#### 👑 Super Admin
- **Estate Management**: Create, view, and manage multiple estates
- **Address Management**: Organize addresses and fields within estates
- **User Management**: Invite and manage users across all estates
- **Bills Management**: Oversee billing operations across estates
- **Meter Management**: Monitor and manage utility meters
- **Transaction Management**: View and manage all transactions
- **Visitor Management**: Track and manage visitor records
- **Payment Management**: Handle payment operations
- **Analytics Dashboard**: Comprehensive overview with charts and statistics

#### 🛡️ Admin
- **Address Management**: Manage addresses, fields, and entries
- **User Management**: Invite and manage users within assigned estate
- **Bills Management**: Create, update, and track bills
- **Meter Management**: Monitor utility meters for residents
- **Visitor Management**: Register and verify visitors
- **Dashboard**: Estate-specific analytics and insights

#### 🏠 Resident
- **Bills Management**: View and pay bills
- **Meter Management**: View meter readings and vend power
- **Transaction History**: Track all payment transactions
- **Wallet Management**: Fund wallet and manage balance

#### 🔒 Security
- **Visitor Verification**: Verify visitor credentials
- **View Visitors**: Access visitor information and records
- **Dashboard**: Security-focused overview

### 🔑 Core Functionality

- **Authentication & Authorization**
  - Secure login/signup system
  - Role-based access control (RBAC)
  - JWT token-based authentication
  - Session management with Redux Persist
  - Password recovery system

- **Billing System**
  - Create and manage bills (electricity, water, maintenance, security)
  - Bill payment tracking
  - Payment history
  - Automated bill generation

- **Transaction Management**
  - Real-time transaction tracking
  - Transaction history
  - Wallet funding
  - Payment processing

- **Meter Management**
  - Utility meter tracking
  - Meter reading management
  - Power vending for prepaid meters
  - Meter analytics

- **Visitor Management**
  - Visitor registration
  - Visitor verification system
  - Visitor history tracking
  - Security integration

- **Address Management**
  - Hierarchical address structure (Estate → Field → Entry)
  - Address assignment to users
  - Address-based filtering

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### State Management
- **Redux Toolkit** - State management
- **Redux Persist** - State persistence

### UI/UX
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Component library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **React Icons** - Additional icons

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Data Visualization
- **Recharts** - Chart library for analytics

### HTTP Client
- **Axios** - HTTP requests with interceptors

### Utilities
- **date-fns** - Date manipulation
- **jwt-decode** - JWT token decoding
- **react-toastify** - Toast notifications
- **Sonner** - Toast notifications
- **react-select** - Select components
- **react-day-picker** - Date picker

### Deployment
- **Vercel** - Hosting and deployment
- **Vercel Analytics** - Analytics integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd estate-management-FE
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=your_api_base_url
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Build for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

### 6. Start Production Server

```bash
npm start
# or
yarn start
# or
pnpm start
# or
bun start
```

## 📁 Project Structure

```
estate-management-FE/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── verify-invited-user/
│   ├── dashboard/                # Dashboard pages
│   │   ├── admin/                # Admin role pages
│   │   ├── estate-admin/         # Estate admin pages
│   │   ├── resident/             # Resident pages
│   │   ├── security/             # Security pages
│   │   ├── super-admin/          # Super admin pages
│   │   └── layout.tsx            # Dashboard layout
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── admin/                    # Admin-specific components
│   ├── estate-admin/             # Estate admin components
│   ├── resident/                 # Resident components
│   ├── super-admin/              # Super admin components
│   ├── client-provider/          # Client-side providers
│   ├── modal/                    # Modal components
│   ├── tables/                   # Table components
│   ├── tabs/                     # Tab components
│   └── ui/                       # Reusable UI components
├── data/                         # Static data and configurations
├── lib/                          # Utility libraries
├── public/                       # Static assets
├── redux/                        # Redux store and slices
│   └── slice/                    # Feature-based slices
│       ├── admin/                # Admin feature slices
│       ├── auth-mgt/             # Authentication slice
│       ├── estate-admin/         # Estate admin slices
│       ├── resident/             # Resident feature slices
│       ├── super-admin/          # Super admin slices
│       └── user-mgt/             # User management slice
├── utils/                        # Utility functions
│   └── axiosInstance.ts          # Axios configuration
├── components.json                # shadcn/ui configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🔐 Authentication Flow

1. User signs up or logs in through `/auth/login` or `/auth/signup`
2. JWT token is stored in localStorage
3. User data is persisted in Redux store with Redux Persist
4. Protected routes check for authentication
5. Token is automatically attached to API requests via Axios interceptor
6. On 401 errors, user is redirected to login page

## 🎨 UI Components

The application uses **shadcn/ui** components built on **Radix UI** primitives. Key components include:

- Buttons, Cards, Dialogs
- Forms with Input, Label, Select
- Data tables with sorting and filtering
- Modals and dialogs
- Tabs and navigation components

## 📊 State Management

The application uses **Redux Toolkit** with the following slices:

- `auth` - Authentication state
- `estate` - Estate management
- `superAdminUser` - Super admin user management
- `adminField` - Address field management
- `adminEntry` - Address entry management
- `adminUser` - Admin user management
- `adminBill` - Bill management
- `residentBill` - Resident bill management
- `wallet` - Wallet management
- `residentTransaction` - Resident transactions
- `estateAdminTransaction` - Estate admin transactions
- `adminMeter` - Admin meter management
- `residentMeter` - Resident meter management
- `superAdminMeter` - Super admin meter management
- `visitor` - Visitor management

All slices are persisted using **Redux Persist** to maintain state across page refreshes.

## 🔌 API Integration

The application uses **Axios** for HTTP requests with:

- Base URL configuration via environment variables
- Automatic token injection via request interceptor
- Error handling via response interceptor
- Automatic logout on 401 errors

## 🧪 Linting

Run the linter:

```bash
npm run lint
# or
yarn lint
# or
pnpm lint
```

## 🚢 Deployment

The application is deployed on **Vercel**:

- **Production**: Automatically deploys from the main branch
- **Development**: Deploys from development branches

### Deployment Steps

1. Push changes to the repository
2. Vercel automatically builds and deploys
3. Environment variables are configured in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Follow the existing file structure
- Use meaningful variable and function names
- Add comments for complex logic

## 🐛 Known Issues

If you encounter any issues, please check:

1. Environment variables are properly set
2. API base URL is correct and accessible
3. Node.js version is compatible
4. All dependencies are installed

## 📄 License

This project is private and proprietary.

## 👥 Support

For support, please contact the development team or open an issue in the repository.

## 🔄 Version

Current version: **0.1.0**

---

Built with ❤️ using Next.js and modern web technologies.
