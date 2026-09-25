# Pet Adoption Management System

Pet Adoption Management System is a full-stack web application for managing pet adoption workflows and shelter operations. It helps visitors discover pets, adopters submit and track adoption requests, and shelter staff manage pets, medical records, inventory, orders, reports, notifications, users, and role-based dashboards.

The project is built as a TypeScript monorepo with a React/Vite frontend, a NestJS backend, shared DTOs/types/constants, PostgreSQL, TypeORM migrations, and Docker support.

## Problem Statement

Animal shelters need a reliable way to publish adoptable pets, process adoption requests, manage adopter communication, track pet health records, and handle daily operational tasks such as inventory, orders, reports, departments, and staff access control. This system centralizes those workflows in one role-based platform so each user can access the tools they need without exposing unrelated management features.

## Team

| Responsibility | Member(s) |
| --- | --- |
| Product Owner | lkhazaal |
| Project Manager | falhaimo |
| Technical Lead | sshawish |
| Developers | falhaimo, sshawish, lkhazaal, rabu-shr, malsharq |
| Frontend | falhaimo, rabu-shr |
| Backend | sshawish, falhaimo, lkhazaal |
| DevOps | malsharq |

## Project Management Approach

The team organized the work using a role-based Agile workflow. The Product Owner defined the main business needs for adopters, shelter staff, veterinarians, managers, and admins. The Project Manager coordinated task distribution, progress tracking, and delivery priorities. The Technical Lead guided architecture decisions, backend/frontend integration, code structure, and technical consistency.

Work was divided by application area:

- Frontend team: page implementation, role-based UI flows, responsive layouts, reusable components, and user experience.
- Backend team: API modules, database entities, authentication, validation, business logic, migrations, and seeding.
- DevOps: Docker setup, environment configuration, deployment readiness, and service orchestration.

The team used feature-based development: each major module was planned, implemented, tested locally, and integrated into the full system. Priority was given to core adoption workflows first, then operational dashboards, inventory/store features, reports, notifications, and deployment support.

## Individual Contributions

| Member | Role(s) | Contributions |
| --- | --- | --- |
| falhaimo | Project Manager, Developer, Frontend, Backend | Coordinated project tasks and delivery flow, contributed to frontend pages and role-based user flows, helped implement backend APIs and integration points. |
| sshawish | Technical Lead, Developer, Backend | Guided technical decisions, backend architecture, NestJS module structure, authentication, database integration, and API implementation. |
| lkhazaal | Product Owner, Developer, Backend | Defined product requirements and user needs, contributed to backend business logic, adoption workflows, user-related features, and API behavior. |
| rabu-shr | Developer, Frontend | Built and refined frontend screens, reusable UI behavior, role-based page experiences, responsive layouts, and user-facing workflows. |
| malsharq | Developer, DevOps | Worked on Docker, environment configuration, deployment readiness, service setup, and operational support for running the project. |

## Features And Implementation Ownership

### Public Visitor

- Browse available pets.
- View pet details.
- Create an adopter account.
- Log in using email/password or OAuth.
- Read terms, privacy policy, and public information pages.

### Adopter

- Access an adopter dashboard.
- Browse pets and view pet profiles.
- Submit and track adoption requests.
- View adoption history.
- Use profile, settings, notifications, and chat pages.
- Browse store items, manage cart items, and complete checkout.

### Employee

- Access staff dashboard pages.
- Manage pets and adoption request review workflows.
- View and update adoption records.
- Manage staff-side chats.
- Work with inventory, suppliers, reports, and orders where role access allows.

### Vet

- Access veterinary dashboard pages.
- View pets assigned to medical workflows.
- Manage medical records and medical entries.
- Manage vaccination records.
- View veterinary reports and profile pages.

### Manager

- Access manager dashboards and analytics.
- Review pets, adoption requests, adoptions, and chats.
- Manage inventory and suppliers.
- View reports, orders, users, and operational metrics.

### Admin

- Access the main administration dashboard.
- Manage users, roles, departments, files, inventory, suppliers, orders, reports, analytics, and activity logs.
- Review pet, adoption, and chat workflows across the system.

### Feature Ownership

| Feature Area | Main Implementer(s) |
| --- | --- |
| Public pages, home page, authentication pages, adopter pages | falhaimo, rabu-shr |
| Pet catalog, pet details, role-based dashboards UI | falhaimo, rabu-shr |
| Authentication, JWT, OAuth, password reset, user profile APIs | sshawish, falhaimo, lkhazaal |
| Pet, adoption request, adoption, medical, and vaccination APIs | sshawish, falhaimo, lkhazaal |
| Store, cart, checkout, orders, inventory, and supplier workflows | sshawish, falhaimo, lkhazaal |
| Admin, manager, staff, and vet operational pages | falhaimo, rabu-shr |
| Reports, notifications, uploads, departments, and activity tracking | sshawish, falhaimo, lkhazaal |
| Docker, environment files, service orchestration, deployment support | malsharq |

## Tech Stack

| Layer | Technology | Justification |
| --- | --- | --- |
| Frontend | React 18, Vite, TypeScript | React supports reusable components, Vite gives fast development builds, and TypeScript improves reliability. |
| UI | Tailwind CSS, Radix UI, MUI icons, lucide-react, Recharts | Provides consistent styling, accessible UI primitives, icons, and dashboard charts. |
| Backend | NestJS 11, TypeScript | NestJS provides a modular structure for controllers, services, guards, validation, and dependency injection. |
| Database | PostgreSQL 15 | Reliable relational database suitable for users, roles, pets, adoptions, orders, and inventory relations. |
| ORM | TypeORM | Integrates well with NestJS and supports entities, repositories, migrations, and seeds. |
| Authentication | JWT, refresh tokens, Passport, Google OAuth | Supports secure session handling and optional social login. |
| Validation | class-validator, class-transformer, NestJS ValidationPipe | Enforces DTO validation and rejects unexpected request fields. |
| Realtime/Notifications | Socket.IO, NestJS WebSockets | Enables realtime notification and communication features. |
| Reports | PDFKit, CSV generation | Supports downloadable operational reports for admins and managers. |
| Email | Nodemailer, NestJS Mailer | Sends password reset and system emails. |
| DevOps | Docker, Docker Compose | Runs frontend, backend, and PostgreSQL consistently across machines. |
| Shared Code | Workspace package with DTOs, enums, constants, validators, and shared types | Reduces duplication between frontend and backend contracts. |

## Subject modules and application scope

The supplied subject awards 1 point per minor module and 2 per major module;
application features do not have independent invented weights. The three frontend
modules implemented and documented here support a **3-point module claim**, subject
to evaluation and the subject’s mandatory requirements:

| Minor module | Points | Implementation and demonstration |
| --- | ---: | --- |
| Three languages | 1 | English, Arabic and French; [translation coverage and checks](docs/internationalization.md) |
| Complete RTL support | 1 | Arabic layout mirroring and seamless direction switching; [RTL verification](docs/internationalization.md) |
| Custom design system | 1 | Palette, typography, icon rules and 17 reusable custom components; [component catalog](docs/design-system.md) |

The following describes the application's functional scope, not an official score:

| Application area | Justification |
| --- | --- |
| Authentication and role-based access | Required to separate public visitors, adopters, employees, vets, managers, and admins. |
| Pet catalog and pet management | Core subject of the system; users must browse, view, create, update, and manage pets. |
| Adoption requests and adoption records | Main business workflow for submitting, reviewing, approving, rejecting, and tracking adoptions. |
| Medical records and vaccinations | Important shelter workflow for pet health tracking and vet responsibilities. |
| User, role, employee, and department management | Needed for administration, staff organization, and access control. |
| Store, cart, checkout, orders, inventory, and suppliers | Adds operational and commerce support for supplies and shelter resources. |
| Dashboards, analytics, reports, and activity logs | Helps managers and admins monitor performance, activity, and operational status. |
| Notifications and chat pages | Improves communication between adopters and shelter staff. |
| File uploads and pet images | Supports pet media, documents, and admin file management. |
| Frontend UI/UX and responsive role-based pages | Makes the system usable for all roles with consistent navigation and design. |
| Docker, environment configuration, and deployment readiness | Ensures the project can be run and evaluated consistently. |

## Repository Structure

```text
pet_adoption/
├── Backend/                 # NestJS API application
│   ├── src/config/           # App and database configuration
│   ├── src/database/         # TypeORM entities, migrations, data source, seeds
│   ├── src/modules/          # Feature modules, controllers, and services
│   └── Dockerfile            # Backend production container
├── Frontend/                 # React/Vite application
│   ├── src/app/              # App shell and routing
│   ├── src/components/       # Shared frontend components
│   ├── src/context/          # Auth, cart, language, and theme contexts
│   ├── src/pages/            # Public and role-based pages
│   └── Dockerfile            # Frontend development container
├── shared/                   # Shared DTOs, enums, constants, validators, and types
├── docker-compose.yml        # PostgreSQL, backend, and frontend services
├── .env.example              # Root/backend environment example
├── package.json              # Root npm workspace scripts
└── package-lock.json         # npm lockfile
```

## Prerequisites

- Node.js 20 or newer.
- npm.
- Docker and Docker Compose.
- PostgreSQL if running the database outside Docker.

## Environment Setup

Create a development environment file from the example:

```bash
cp .env.example .env.development
```

For frontend-only environment values, create a local frontend env file when needed:

```bash
cp Frontend/.env.example Frontend/.env.local
```

Important variables:

| Variable | Purpose | Default or Example |
| --- | --- | --- |
| `PORT` | Backend API port | `3000` |
| `FRONTEND_PORT` | Frontend Vite port | `5173` |
| `POSTGRES_HOST` | PostgreSQL host | `postgres` for Docker |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `pet_adoption` |
| `POSTGRES_USER` | Database user | `pet_adoption_user` |
| `POSTGRES_PASSWORD` | Database password | `change_me` |
| `FRONTEND_URL` | Allowed frontend origin | `http://localhost:5173` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | Replace with a long random value |
| `JWT_REFRESH_SECRET` | Refresh token secret | Replace with a different long random value |
| `MAIL_USER` | Email sender account | Project email account |
| `MAIL_PASSWORD` | Email sender password | App password or email password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud value |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud value |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `http://localhost:3000/auth/google/callback` |

Do not commit real secrets, production passwords, OAuth credentials, or mail credentials.

## Local Development

Install all workspace dependencies from the repository root:

```bash
npm install
```

Start the backend API:

```bash
npm run backend:dev
```

The backend runs at:

```text
http://localhost:3000
```

Start the frontend in another terminal:

```bash
npm run frontend:dev
```

The frontend runs at:

```text
http://localhost:5173
```

The root shortcut also starts the frontend development server:

```bash
npm run dev
```

## Docker Setup

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Services:

| Service | Container | Port |
| --- | --- | --- |
| PostgreSQL | `pet_adoption_postgres` | `5432` |
| Backend | `pet_adoption_backend` | `3000` |
| Frontend | `pet_adoption_frontend` | `5173` |

Stop the stack:

```bash
docker compose down
```

Stop the stack and remove volumes:

```bash
docker compose down -v
```

## Database Migrations And Seeding

Run migrations from the repository root:

```bash
npm run migration:run
```

Generate a migration:

```bash
npm run migration:generate
```

Revert the latest migration:

```bash
npm run migration:revert
```

Run development seed data:

```bash
npm run seed -w pet-adoption-backend
```

Run production seed data:

```bash
npm run seed:production -w pet-adoption-backend
```

## Database Schema

The database uses PostgreSQL with TypeORM entities and migrations. The schema is organized around authentication, pet adoption, medical care, store/inventory, communication, reporting, and administration.

### Main Tables

| Table / Entity | Purpose |
| --- | --- |
| `users` | Stores user accounts, credentials, profile data, status, and role relationship. |
| `roles` | Stores role definitions such as adopter, employee, vet, manager, and admin. |
| `oauth_accounts` | Links users to OAuth providers such as Google. |
| `password_reset_tokens` | Stores hashed password reset tokens and expiration data. |
| `adopters` | Stores adopter profile information linked to users. |
| `employees` | Stores employee profile and staff-related data linked to users and departments. |
| `departments` | Groups employees by shelter department. |
| `pets` | Stores pet profile data, species, breed, age, adoption status, and listing information. |
| `pet_images` | Stores pet image records linked to pets and uploaded files. |
| `file_uploads` | Stores uploaded file metadata and file categories. |
| `adoption_requests` | Stores adopter requests for specific pets and request statuses. |
| `adoptions` | Stores completed or active adoption records. |
| `medical_records` | Stores one medical record per pet. |
| `medical_entries` | Stores medical notes, diagnoses, treatments, and visit records. |
| `vaccinations` | Stores vaccination details, due dates, and vaccine status. |
| `suppliers` | Stores supplier information for inventory items. |
| `supplies` | Stores shelter/store supply items, stock, category, status, and product mapping. |
| `products` | Stores product records used for store workflows. |
| `carts` | Stores user shopping carts. |
| `cart_items` | Stores items inside each cart. |
| `orders` | Stores checkout/order records. |
| `order_items` | Stores products and quantities within each order. |
| `payments` | Stores payment records linked to orders. |
| `conversations` | Stores chat conversations between adopters and staff. |
| `messages` | Stores messages inside conversations. |
| `notifications` | Stores user notifications and read/unread status. |
| `activity_logs` | Stores administrative and operational activity history. |

### Key Relationships

- One role can be assigned to many users.
- One user can have one adopter profile, one employee profile, many OAuth accounts, notifications, conversations, carts, orders, and activity records.
- One department can have many employees.
- One pet can have many images, adoption requests, vaccinations, and medical entries through its medical record.
- One adopter can submit many adoption requests and can have multiple adoption records.
- One cart contains many cart items, and one order contains many order items.
- One supplier can provide many supplies.
- One conversation contains many messages.

### Schema Management

- Entities are stored in `Backend/src/database/entities`.
- Migrations are stored in `Backend/src/database/migrations`.
- Seed files are stored in `Backend/src/database/seeding`.
- TypeORM is used to keep database changes versioned and repeatable.

## Available Scripts

### Root Workspace Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the frontend development server. |
| `npm run start` | Starts the frontend development server. |
| `npm run backend:dev` | Starts the NestJS backend in watch mode. |
| `npm run backend:start` | Starts the compiled backend entrypoint. |
| `npm run backend:build` | Builds the backend workspace. |
| `npm run frontend:dev` | Starts the Vite frontend development server. |
| `npm run frontend:build` | Builds the frontend workspace. |
| `npm run migration:generate` | Generates a TypeORM migration. |
| `npm run migration:run` | Runs TypeORM migrations. |
| `npm run migration:revert` | Reverts the latest TypeORM migration. |

### Backend Scripts

| Command | Description |
| --- | --- |
| `npm run build -w pet-adoption-backend` | Builds the NestJS backend. |
| `npm run start:dev -w pet-adoption-backend` | Runs the backend in watch mode. |
| `npm run seed -w pet-adoption-backend` | Runs development database seeds. |
| `npm run seed:production -w pet-adoption-backend` | Runs production database seeds. |
| `npm run migration:run -w pet-adoption-backend` | Runs backend migrations directly. |

### Frontend Scripts

| Command | Description |
| --- | --- |
| `npm run dev -w pet-adoption-frontend` | Starts the Vite frontend. |
| `npm run build -w pet-adoption-frontend` | Builds the frontend for production. |

## Backend Module Overview

| Module | Purpose |
| --- | --- |
| Auth | Signup, login, JWT authentication, current profile access, password flows. |
| OAuth | Google OAuth authentication flow. |
| Users | User profile, user management, employee lookup support. |
| Pets | Pet catalog and pet management. |
| Adoptions | Adoption requests, approvals, rejections, cancellations, and adoption records. |
| Medical | Medical records and medical entries for pets. |
| Vaccinations | Vaccination records and vaccination status tracking. |
| Cart | Shopping cart and cart item workflows. |
| Store | Storefront supply/product browsing. |
| Checkout | Checkout workflow. |
| Order | Order records and order management. |
| Inventory | Supplies, suppliers, stock, and inventory operations. |
| Dashboard | Role dashboards and operational summaries. |
| Reports | PDF and CSV report generation. |
| Notifications | Notification APIs and realtime notification gateway. |
| Uploads | File uploads and static upload serving. |
| Departments | Department management. |

## API Overview

The backend is organized around REST-style NestJS controllers. Main API areas include:

- `/auth` for authentication.
- `/auth/google` routes for OAuth.
- `/users` for profile and user management.
- `/pets` for public pet browsing and internal pet management.
- `/adoption` for requests and adoption records.
- `/pets/:petId/medical-record` and `/medical-entries` for medical workflows.
- `/pets/:petId/vaccinations` and `/vaccinations` for vaccination workflows.
- `/cart` for cart operations.
- `/store` for storefront data.
- `/checkout` for checkout actions.
- `/orders` or order module routes for order management.
- `/dashboard` for dashboards.
- `/reports` for generated reports.
- `/notifications` for notification workflows.
- `/departments` for department workflows.
- `/uploads` for uploaded files served by the backend.

## Frontend Routing Overview

The frontend uses hash-based routing and role guards inside `Frontend/src/app/App.tsx`.

Public routes include:

- Home
- About
- Login
- Signup
- Forgot password
- Reset password
- OAuth callback
- Pets list
- Pet details
- Terms
- Privacy policy

Authenticated role areas include:

- Adopter dashboard, requests, adoptions, chats, shop, cart, profile, notifications, and settings.
- Employee dashboard, pets, adoption requests, adoptions, chats, orders, inventory, suppliers, and reports.
- Vet dashboard, pets, medical records, vaccinations, reports, and profile.
- Manager dashboard, analytics, inventory, users, reports, orders, suppliers, chats, pets, requests, and adoptions.
- Admin dashboard, users, roles, departments, orders, inventory, suppliers, files, reports, analytics, activity log, chats, pets, requests, and adoptions.

## Build And Verification

Build the backend:

```bash
npm run backend:build
```

Build the frontend:

```bash
npm run frontend:build
```

Validate the Docker Compose file:

```bash
docker compose config
```

Check the current git state before submitting:

```bash
git status
```

## Security Notes

- JWT access and refresh secrets must be unique, long, and private.
- Passwords are hashed with bcrypt before storage.
- The backend uses Helmet to set security-related HTTP headers.
- CORS is configured from `FRONTEND_URL` or `FRONTEND_URLS`.
- Global validation uses NestJS `ValidationPipe` with whitelisting and non-whitelisted property rejection.
- Role-based guards and role-specific frontend routing restrict access by user type.
- Uploaded files are served from the backend uploads path and should be validated before storage.
- Production deployments must replace all example secrets and credentials.

## Screenshots

Add screenshots before final submission if required by the evaluation sheet:

- Home page.
- Pet catalog.
- Pet details.
- Adopter dashboard.
- Staff adoption request review.
- Vet medical records page.
- Manager analytics page.
- Admin dashboard.

Suggested folder:

```text
docs/screenshots/
```

## Contribution Workflow

1. Pull the latest changes before starting work.
2. Create a branch for the task, for example `feature/adoption-request-flow` or `fix/login-validation`.
3. Keep changes focused on one feature or fix.
4. Run the relevant build or verification command before opening a pull request.
5. Use clear commit messages, for example `Add adoption request status filters`.
6. Request review from the technical lead or the teammate responsible for the touched area.
7. Do not commit `.env` files with real secrets, generated build output, or local-only files.

## Future Improvements

- Add automated unit and integration tests for backend services and controllers.
- Add frontend component and end-to-end tests for core workflows.
- Add API documentation with Swagger/OpenAPI.
- Add production CI/CD pipelines.
- Add screenshots and demo GIFs to the README.
- Add advanced search and recommendation features for pet matching.
- Improve analytics with more export formats and filtering options.
- Expand realtime chat and notification behavior.

## Project Status

The project currently includes a working full-stack structure with role-based frontend pages, NestJS backend modules, shared TypeScript contracts, database migrations/seeds, and Docker Compose support. The README is intended to help evaluators, developers, and team members install, run, understand, and assess the system quickly.

See [File upload and management](docs/file-management.md) for access rules, previews,
upload progress, verification commands and the live demonstration workflow.
