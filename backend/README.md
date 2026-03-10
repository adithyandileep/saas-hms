# SaaS Hospital Management System (HMS)

Welcome to the SaaS Hospital Management System. This project is a comprehensive full-stack application built using:
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: Next.js (React), Tailwind CSS, Zustand, shadcn/ui
- **Package Manager**: pnpm

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Prisma Postgres](https://prisma.io/) (Prisma Client, Prisma Studio)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

---

## 🚀 Getting Started

Follow these steps to get your development environment set up after cloning the repository.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd saas-hms
```

### 2. Backend Setup

The backend handles APIs, database interactions, and business logic.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```
3. Environment Configuration:
   Create a `.env` file in the `backend` directory. You can use an existing `.env` file (like `.env.adithyan` if available) as a reference:
   ```env
   # Example backend/.env
   DATABASE_URL="postgres://1ef9ba8fb7572ee28103c23a732c42eee2b0e48dae74a676ed89350f708bec1f:sk_Qq8skkNoRaGK8t4WKDEfR@db.prisma.io:5432/postgres?sslmode=require"
   PORT=5000
   FRONTEND_URL="http://localhost:3000"
   JWT_SECRET="supersecretjwtkeythatshouldbechangedinproduction"
   ```
   *Make sure to replace the `DATABASE_URL` with your actual local Postgres connection string.*

4. Setup the Database (Prisma):
   Run the following command to push the schema to your database and generate the Prisma Client:
   ```bash
   npx prisma migrate dev
   ```
   ```bash
   pnpm db:reset (will reset the entire database)
   ```
   *(If this is the first run, it will ask for a name for the migration. e.g., "init")*


### 3. Frontend Setup

The frontend is a Next.js application that provides the UI dashboards for different roles (Admin, Doctor, Receptionist, Patient).

1. Open a **new terminal tab/window**, navigate back to the root, and enter the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```
3. Environment Configuration:
   Create a `.env.local` file in the `frontend` directory:
   ```env
   # Example frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start the Development Server:
   ```bash
   pnpm dev
   ```
   The frontend UI should now be available at `http://localhost:3000`.

---

## 🛠️ Usage Flow

1. **First-run Setup**: When you visit `http://localhost:3000` for the first time, the application will detect that no SuperAdmin exists and redirect you to the `/install` wizard.
2. **Organization Configuration**: Fill out the hospital organization details and create the default SuperAdmin user during setup.
3. **Login**: Once setup is complete, you will be redirected to the login page to sign in with your newly created SuperAdmin credentials.
4. **Dashboards**: Based on your role, Next.js will dynamically route you to your appropriate dashboard (e.g., `/admin`, `/doctor`, `/patient`).

## 📁 Project Structure

```text
saas-hms/
├── backend/          # Express.js API, Prisma schema, Authentication, Database routing
│   ├── prisma/       # Database schema setup
│   ├── src/          # Source code, modular architecture (modules/auth, modules/patient, etc.)
│   └── uploads/      # Locally stored files (e.g., Medical Reports)
└── frontend/         # Next.js Application
    ├── src/app/      # App Router (Pages for Dashboard, Setup, Auth)
    ├── src/components/# Reusable UI Elements (Sidebar, Tables, Shadcn Components)
    ├── src/lib/      # Axios instance, formatting tools
    └── src/store/    # Zustand state management (Authentication state)
```
# drweb
# backend
