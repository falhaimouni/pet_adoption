# Backend Changes Report

This document summarizes the backend integration fixes made for the Pet Adoption System, why each change was needed, and how the implementation works.

## Summary

The backend was updated to support the frontend integration for store/cart, employee creation, Google OAuth, vaccinations, and related RBAC rules. The changes preserve the existing NestJS module structure, JWT authentication, role guards, ownership checks, and TypeORM patterns.

## Store and Cart Integration

### Reason

`GET /store/supplies` returned store supply IDs, while `POST /cart/items` required product IDs. `Supply` and `Product` were separate entities, and the frontend could not safely assume `productId === supplyId`.

### How It Works

- `Supply` now has a required `productId`.
- `Supply` has a `ManyToOne` relation to `Product`.
- `Product` has a `OneToMany` relation back to supplies.
- Store responses now include the real `productId`.
- Cart still accepts only `productId`, preserving the existing cart/product model.
- Cart operations remain scoped to `req.user.userId`.
- Cart routes remain `ADOPTER` only.

### Files

- `Backend/src/database/entities/supply.entity.ts`
- `Backend/src/database/entities/product.entity.ts`
- `Backend/src/modules/store/store.service.ts`
- `Backend/src/modules/inventory/services/supply.service.ts`
- `Backend/src/modules/inventory/inventory.module.ts`
- `shared/dto/storeSupply.dto.ts`
- `shared/dto/StoreSupplyDetails.dto.ts`
- `Backend/src/database/migrations/1789030000000-AddSupplyProductMappingAndVaccinationFields.ts`

## Cart Quantity Update

### Reason

The frontend needed backend support to update item quantities with `PATCH /cart/items/:productId`.

### How It Works

- Added `UpdateCartItemDto` export for backend cart DTO usage.
- Added `PATCH /cart/items/:productId`.
- The service locks the authenticated user's cart and the target cart item.
- Quantity is set to the requested value.
- Unit price and subtotal are recalculated from the product price.
- The updated cart is returned with product relations.

### Verification Fix

Runtime testing found Postgres rejected `FOR UPDATE` with a `LEFT JOIN`. The cart item query now uses `innerJoinAndSelect` because a cart item requires a product.

### Files

- `Backend/src/modules/cart/cart.controller.ts`
- `Backend/src/modules/cart/cart.dto.ts`
- `Backend/src/modules/cart/cart.service.ts`

## Employee Lookup Endpoints

### Reason

`POST /users/employees` requires valid `roleId` and `departmentId`, but the frontend had no safe way to fetch those IDs. Hardcoding database UUIDs would be unsafe.

### How It Works

- Added `GET /roles`.
- Added `GET /departments`.
- Both endpoints require JWT auth and `ADMIN`.
- Roles return only assignable employee roles: `MANAGER`, `EMPLOYEE`, `VET`.
- Roles do not expose `ADMIN` or `ADOPTER`.
- Departments return active departments only.
- Returned fields are intentionally minimal.
- `POST /users/employees` remains `ADMIN` only.

### Files

- `Backend/src/modules/users/employee-lookups.controller.ts`
- `Backend/src/modules/users/users.module.ts`

## User Role Assignment Hardening

### Reason

Employee-management lookup endpoints should not create a path for managers or lower roles to assign privileged roles.

### How It Works

- Role assignment is explicitly checked in `UsersService`.
- Only admins can assign roles.
- Non-admin users cannot change another user's role through update paths.
- Existing lower-level management restrictions remain in place.

### Files

- `Backend/src/modules/users/users.service.ts`

## Google OAuth Frontend Flow

### Reason

The Google OAuth callback previously returned JSON directly from the backend, leaving the browser on the backend response instead of returning to the SPA.

### How It Works

- Google still starts at `GET /auth/google`.
- Google redirects to `GET /auth/google/callback`.
- Backend validates the Google user.
- Backend creates normal access and refresh tokens internally.
- Backend stores the auth result behind a short-lived one-time code.
- Backend redirects to the frontend hash route:
  - `FRONTEND_URL#/oauth-callback?code=...`
- Frontend completes login with:
  - `POST /auth/google/session`
- Tokens are returned only from the session endpoint response, not in URL query parameters.
- One-time OAuth codes expire after 60 seconds and are deleted when consumed.

### Security Behavior

If a Google email matches an existing local account, the backend does not silently link the accounts. Because the project does not have a verified-email mechanism for local accounts, automatic linking is refused to avoid account-confusion/pre-hijacking risk.

### Files

- `Backend/src/modules/oauth/oauth.controller.ts`
- `Backend/src/modules/oauth/oauth.service.ts`
- `Backend/src/modules/auth/auth.service.ts`

## OAuth and CORS Configuration

### Reason

The example Google callback URL used an internal Docker hostname, and frontend origins can vary between local and Docker development.

### How It Works

- `.env.example` now uses a local externally reachable callback example.
- `FRONTEND_URL` controls the OAuth frontend redirect target.
- Optional `FRONTEND_URLS` supports multiple comma-separated CORS origins.
- CORS continues to allow credentials and standard API headers.

### Files

- `.env.example`
- `Backend/src/main.ts`

## Vaccination Persistence

### Reason

Vaccination DTOs accepted `batch`, `status`, and `notes`, but those fields did not persist or return consistently.

### How It Works

- `Vaccination` entity now stores:
  - `batch`
  - `status`
  - `notes`
- `status` uses the existing vaccination status enum values.
- Create maps supported DTO fields to entity columns.
- Update applies supported fields when provided.
- Responses include the persisted values.
- Canonical date/name fields remain:
  - `vaccineName`
  - `vaccinationDate`
  - `nextDueDate`

### Files

- `Backend/src/database/entities/vaccination.entity.ts`
- `Backend/src/modules/vaccinations/vaccinations.service.ts`
- `shared/dto/vaccination.dto.ts`
- `shared/types/vaccination.types.ts`
- `Backend/src/database/migrations/1789030000000-AddSupplyProductMappingAndVaccinationFields.ts`

## RBAC Hardening

### Reason

Frontend integration exposed places where the UI should not show actions, but backend authorization must remain the real security boundary.

### How It Works

- Vet users can no longer upload general pet images.
- Employee users can no longer delete pets.
- Employee users can no longer delete supplies or suppliers.
- Manager/admin permissions remain intact where already allowed.

### Files

- `Backend/src/modules/pets/pets.controller.ts`
- `Backend/src/modules/inventory/conrollers/inventory.controller.ts`

## Seed and Migration Updates

### Reason

Existing seed data needed to remain compatible with the new required supply/product mapping and repeated seeding after normal cart usage.

### How It Works

- Products are seeded before supplies.
- Supply seed data creates or reuses matching products.
- Supplies store the mapped `productId`.
- Cart seeding is idempotent by user ownership.
- Cart item seeding finds carts through adopter email instead of assuming fixed cart IDs.

### Files

- `Backend/src/database/seeding/seed.service.ts`
- `Backend/src/database/seeding/seeds/supply.seed.ts`
- `Backend/src/database/seeding/seeds/cart.seed.ts`
- `Backend/src/database/seeding/seeds/cart-item.seed.ts`

## Database Migration

### Migration

`Backend/src/database/migrations/1789030000000-AddSupplyProductMappingAndVaccinationFields.ts`

### Changes

- Adds `supplies.product_id`.
- Creates product rows for existing supplies when needed.
- Links existing supplies to products.
- Adds a foreign key from supplies to products.
- Adds vaccination columns:
  - `batch`
  - `status`
  - `notes`

## Verification

The following checks were run successfully:

- `npm run build -w pet-adoption-backend`
- `npm run build -w pet-adoption-frontend`
- `npm run migration:run -w pet-adoption-backend`
- `npm run seed -w pet-adoption-backend`
- `git diff --check -- Backend shared .env.example`

Runtime smoke checks verified:

- Admin can fetch employee role and department lookups.
- Manager cannot access employee lookup endpoints.
- Admin can create an employee.
- Manager cannot create an employee.
- Store supplies return real product IDs.
- Store `productId` is not assumed to equal `supplyId`.
- Adopter can add a store product to cart.
- Cart quantity update works.
- Invalid cart quantity is rejected.
- Admin cannot access adopter cart routes.
- Vaccination create, update, list, and delete work.
- `batch`, `status`, and `notes` persist and return.
- Adopter cannot access internal vaccination records.
- Employee cannot delete suppliers.
- Vet cannot upload general pet images.
- Invalid OAuth session code returns `401`.
- CORS preflight allows the configured frontend origin.

## Remaining Notes

The real Google OAuth provider browser flow requires valid Google OAuth credentials and matching Google Console configuration. The backend OAuth callback/session contract was implemented and invalid session behavior was verified locally.
