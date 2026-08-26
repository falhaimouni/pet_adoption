# Backend Feature Handoff for Frontend

This document describes the backend functionality currently implemented and the frontend pages/workflows needed to use it.

## Backend Basics

- Backend base URL is the configured server URL, commonly `http://localhost:3000`.
- There is no global `/api` prefix. For example, the pet list is `GET /pets`.
- Send authenticated requests with `Authorization: Bearer <access-token>`.
- Access tokens expire by default after one hour. Refresh tokens expire by default after seven days.
- Unknown request fields are rejected. DTO validation and type transformation are enabled globally.
- Uploaded files are served below `/uploads/`.
- The backend accepts frontend requests from `FRONTEND_URL`; development defaults to `http://localhost:5173`.
- Authentication is throttled: login/signup allow 5 requests per minute, forgot-password allows 3, and other auth routes allow 20.

## Roles and Navigation

The exact role values are `ADMIN`, `MANAGER`, `EMPLOYEE`, `VET`, and `ADOPTER`.

| Area | Admin | Manager | Employee | Vet | Adopter |
|---|---:|---:|---:|---:|---:|
| Public pet browsing | Yes | Yes | Yes | Yes | Yes |
| Store browsing | Yes | Yes | Yes | Yes | Yes |
| Adoption requests | All | All | All | View only | Own requests |
| Pet management | Yes | Yes | Yes | Images only | No |
| Medical records | View | View | View | View/edit | No |
| Inventory read | Yes | Yes | Yes | No | No |
| Inventory write | Yes | Yes | Yes | No | No |
| User management | Yes | Lower-ranked users | No | No | No |
| Admin dashboard | Yes | No | No | No | No |
| Manager dashboard | No | Yes | No | No | No |
| Adoption reports | Yes | Yes | Yes | No | No |
| Inventory reports | Yes | Yes | No | No | No |
| Pet reports | Yes | Yes | Yes | Yes | No |

## Pages and Workflows to Implement

### 1. Authentication

Pages:

- Sign up
- Login
- Forgot password
- Reset password
- Change password
- Profile/account page
- Optional Google sign-in callback handling

Endpoints:

| Method | Route | Access | Request |
|---|---|---|---|
| POST | `/auth/signup` | Public | `firstName`, `lastName`, `email`, `password`, `confirmPassword`, optional `phone` |
| POST | `/auth/login` | Public | `email`, `password` |
| POST | `/auth/refresh` | Public | `refreshToken` |
| GET | `/auth/profile` | Logged in | None |
| POST | `/auth/change-password` | Logged in | `currentPassword`, `newPassword`, `confirmPassword` |
| POST | `/auth/logout` | Logged in | None |
| POST | `/auth/forgot-password` | Public | `email` |
| POST | `/auth/forget-password` | Public alias | `email` |
| POST | `/auth/reset-password` | Public | `token`, `newPassword`, `confirmPassword` |
| GET | `/auth/google` | Public | Redirects to Google |
| GET | `/auth/google/callback` | Public callback | Returns OAuth result |

Signup always creates an `ADOPTER`. Login returns access and refresh tokens plus basic user data. Password reset tokens are single-use and expire after one hour. Google users are created as active adopters.

Password rules are enforced by the backend; the frontend should use the shared auth DTOs as the source of truth rather than a shorter client-only rule.

### 2. Pet Catalog and Pet Management

Pages:

- Public pet listing/search
- Public pet details
- Staff pet management list
- Add/edit pet form
- Pet image upload
- Staff pet profile with medical and vaccination summary

Endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/pets` | Public | List/filter pets |
| GET | `/pets/:id` | Public | Pet details and images |
| GET | `/pets/:id/full` | Admin, manager, employee, vet | Pet plus medical/vaccination summary |
| POST | `/pets` | Admin, manager, employee | Create pet |
| POST | `/pets/:petId/images` | Admin, manager, employee, vet | Upload multipart field `file` |
| PATCH | `/pets/:id` | Admin, manager, employee | Update pet |
| DELETE | `/pets/:id` | Admin, manager, employee | Remove/archive pet |

Pet list filters: `search`, `species`, `breed`, `status`, `health`, `minAge`, and `maxAge`. Pet creation supports `name`, `species`, optional `breed`, `age`, `gender`, `color`, `weight`, and `description`. Updates also support adoption and health status.

Pet image and avatar uploads accept multipart field `file`, with a maximum size of 5 MB. Returned paths are under `/uploads/`.

### 3. Adoptions

Pages:

- Adopter: adoptable pet details with request form
- Adopter: my adoption requests
- Adopter: request details and cancel action
- Staff: all adoption requests queue
- Staff: request details with approve/reject actions
- Staff: completed/pending adoptions list

Endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/adoption/requests` | All roles | Adopters see own requests; staff see all |
| GET | `/adoption/adoptions` | All roles | Adopters see own adoptions; staff see all |
| GET | `/adoption/requests/:requestId` | All roles | Request details; adopters can only access own |
| POST | `/adoption/requests` | Adopter | Body: `petId`, optional `notes` |
| PATCH | `/adoption/requests/:requestId/cancel` | Adopter | Cancel own pending request |
| POST | `/adoption/requests/:requestId/approve` | Admin, manager, employee | Approve request |
| POST | `/adoption/requests/:requestId/reject` | Admin, manager, employee | Reject pending request |

Important state changes:

- Creating a request changes the pet to `PENDING`.
- Approval changes the pet to `ADOPTED`, creates an adoption, and rejects competing pending requests.
- Rejection or cancellation can return the pet to `AVAILABLE`.
- Adoption changes create notifications and Socket.IO events.

### 4. Dashboards

Pages:

- Admin dashboard
- Manager dashboard

| Method | Route | Role | Contents |
|---|---|---|---|
| GET | `/dashboard/admin` | Admin | User, pet, adoption, medical, inventory, and recent activity metrics |
| GET | `/dashboard/manager` | Manager | Manager-scoped employee, vet, adopter, and supply metrics |

There are no dashboard endpoints for employees, vets, or adopters. Those roles need their relevant list/detail pages instead of a dashboard API.

### 5. Staff and User Management

Pages:

- Staff user list with active/inactive filter
- Staff user details
- Create employee form
- Edit user form
- User profile page
- Avatar upload

Endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/users/profile` | Logged in | Current user profile |
| PATCH | `/users/profile` | Logged in | Update own `firstName`, `lastName`, `phone`, or `avatar` |
| POST | `/users/profile/avatar` | Logged in | Upload avatar as multipart `file` |
| GET | `/users` | Admin, manager | List users; optional `status=active`, `inactive`, or `all` |
| POST | `/users/employees` | Admin | Create employee with role/department and employment details |
| GET | `/users/:id` | Admin, manager | User details, subject to manager visibility limits |
| PATCH | `/users/:id` | Admin, manager | Update user, subject to role hierarchy |
| DELETE | `/users/:id` | Admin | Delete/deactivate user |

Admins cannot create `ADMIN` or `ADOPTER` employee records. Email changes are blocked. Managers can only view and update lower-ranked users.

### 6. Veterinary Records

Pages:

- Staff pet medical record view
- Medical entry details
- Vet add/edit/delete medical entry form
- Vaccination list
- Vet add/edit/delete vaccination form

Medical endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/pets/:petId/medical-record` | Admin, manager, employee, vet | Get pet medical record |
| GET | `/medical-entries/:entryId` | Admin, manager, employee, vet | Get entry |
| POST | `/pets/:petId/medical-record/entries` | Vet | Add entry |
| PATCH | `/medical-entries/:entryId` | Vet | Edit entry |
| DELETE | `/medical-entries/:entryId` | Vet | Archive/delete entry |

Medical entry fields: `diagnosis`, `treatment`, `vaccinationStatus`, `medicalDate`, and optional `notes`. The first entry creates the medical record automatically.

Vaccination endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/pets/:petId/vaccinations` | Admin, manager, employee, vet | List vaccinations |
| POST | `/pets/:petId/vaccinations` | Vet | Add vaccination |
| PATCH | `/vaccinations/:vaccinationId` | Vet | Edit vaccination |
| DELETE | `/vaccinations/:vaccinationId` | Vet | Archive/delete vaccination |

Vaccination fields include `vaccineName`, `vaccinationDate`, optional `nextDueDate`, and `notes`. A medical record must exist first, and `nextDueDate` must be after `vaccinationDate`.

### 7. Inventory and Suppliers

Pages:

- Inventory supplies list with pagination, search, filters, and sorting
- Low-stock list/alert view
- Supply details
- Add/edit supply form
- Suppliers list
- Supplier details with associated supplies
- Add/edit supplier form

Supply endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/inventory/supplies` | Admin, manager, employee | List supplies |
| GET | `/inventory/supplies/low-stock` | Admin, manager, employee | List low-stock supplies |
| GET | `/inventory/supplies/:id` | Admin, manager, employee | Supply details with supplier |
| POST | `/inventory/supplies` | Admin, manager, employee | Create supply |
| PATCH | `/inventory/supplies/:id` | Admin, manager, employee | Update supply |
| DELETE | `/inventory/supplies/:id` | Admin, manager, employee | Deactivate supply |

Supply filters: `page`, `limit`, `search`, `category`, `isActive`, `sortBy`, and `order`. Supply fields include `supplyName`, `category`, `quantity`, `sellingPrice`, `purchasePrice`, `lowStockLimit`, `supplierId`, `minimumOrderQuantity`, optional `deliveryTimeDays`, and `status`.

Supplier endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/inventory/suppliers` | Admin, manager, employee | List active suppliers |
| GET | `/inventory/suppliers/:id` | Admin, manager, employee | Supplier with supplies |
| POST | `/inventory/suppliers` | Admin, manager, employee | Create supplier |
| PATCH | `/inventory/suppliers/:id` | Admin, manager, employee | Update supplier |
| DELETE | `/inventory/suppliers/:id` | Admin, manager, employee | Deactivate supplier |

Supplier fields: `supplierName`, `phone`, `email`, `address`, `city`, and `country`. Low-stock transitions notify active admins and managers.

### 8. Store and Cart

Pages:

- Store catalog
- Store supply details
- Cart

Store endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/store/supplies` | All roles, JWT required | Paginated store catalog |
| GET | `/store/supplies/:id` | All roles, JWT required | Available active in-stock supply |

Store filters: `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, and `order`. Store responses expose selling price and availability, not purchase price. The store home endpoint is not implemented; the frontend should use the catalog endpoint.

Cart endpoints:

| Method | Route | Access | Request |
|---|---|---|---|
| GET | `/cart/me` | Logged in | Current cart; creates one if needed |
| POST | `/cart/items` | Logged in | `productId`, `quantity` |
| DELETE | `/cart/items/:productId` | Logged in | Remove item |
| DELETE | `/cart/me` | Logged in | Clear cart |

The cart returns item quantity, unit price, and subtotal. The backend cart uses `productId`, while the implemented store exposes `Supply`; confirm identifier compatibility during integration.

### 9. Notifications

Pages/components:

- Notification bell with unread count
- Notification list
- Mark one notification read
- Mark all notifications read

Endpoints:

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/notifications` | Logged in | Current user notifications, newest first |
| GET | `/notifications/unread-count` | Logged in | Returns `{ count }` |
| PATCH | `/notifications/:notificationId/read` | Logged in | Mark one as read |
| PATCH | `/notifications/read-all` | Logged in | Mark all as read |

The backend also emits Socket.IO `new_notification` events. The Socket.IO token can be sent through `handshake.auth.token` or the Authorization header. REST polling remains available.

### 10. Reports and Exports

Pages:

- Adoption reports with filters and CSV/PDF export
- Inventory reports with filters and CSV/PDF export
- Pet reports with filters and CSV/PDF export

Adoption reports, for admin/manager/employee:

- `GET /reports/adoptions`
- `GET /reports/adoptions/export/csv`
- `GET /reports/adoptions/export/pdf`
- Filters: `status`, `from`, `to`, `species`

Inventory reports, for admin/manager:

- `GET /reports/inventory`
- `GET /reports/inventory/export/csv`
- `GET /reports/inventory/export/pdf`
- Filters: `status`, `category`, `supplier`

Pet reports, for admin/manager/employee/vet:

- `GET /reports/pets`
- `GET /reports/pets/export/csv`
- `GET /reports/pets/export/pdf`
- Filters: `species`, `status`, `health`, `minAge`, `maxAge`

Export responses are file downloads with attachment names such as `adoption-report.csv` and `adoption-report.pdf`.

## System Status Endpoints

These are mainly useful for deployment/operations pages or health checks:

- `GET /` returns application status.
- `GET /health` returns `{ status: "alive" }`.
- `GET /ready` checks database readiness.
- `GET /version` returns the backend version.

## Not Implemented Yet

Do not build frontend workflows that depend on these as working backend features:

- Messaging/conversations: shared DTOs and constants exist, but no HTTP controller/service is registered.
- Checkout, orders, and payments: shared types exist, but no backend routes are registered.
- `/pets/search`: referenced by shared constants but not implemented; use `GET /pets` with `search`.
- Store home endpoint: controller route is commented out; use `GET /store/supplies`.

## Current Frontend Status

The current frontend prototype contains:

- An admin/manager dashboard data loader for `/dashboard/admin` and `/dashboard/manager`.
- A reset-password page at `/reset-password` connected to `/auth/reset-password`.
- Temporary local-storage based access-token and role selection for dashboard testing.

The production authentication, pet catalog, adoption, staff, veterinary, inventory, store, cart, notification, and reports pages still need to be implemented and connected to the routes above.

## Frontend Integration Notes

- Use `/auth/signup`, not the stale `/auth/register` path in older shared constants.
- Verify medical endpoint constants against the actual routes listed above.
- Store routes require JWT even though pet browsing is public.
- Handle `401` by refreshing the access token, then retrying once; refresh/logout/password change invalidate refresh tokens when appropriate.
- Render role-based navigation from the exact uppercase role values.
- Treat delete operations for pets, supplies, suppliers, medical entries, and vaccinations as possible archive/deactivation operations rather than assuming permanent deletion.
- Use shared DTOs, enums, and constants for valid species, statuses, categories, and roles.