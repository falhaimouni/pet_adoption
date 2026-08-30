Continue the existing Pet Adoption System design that already exists in this Figma file.

IMPORTANT:
- DO NOT redesign the application.
- Keep the exact same design language, visual identity, color palette, typography, spacing, border radius, shadows, icons, component styles, layouts, navigation, and overall UX.
- All newly created pages must look as if they were designed by the same designer in the same design system.
- Reuse existing components whenever possible.
- Follow the same Auto Layout structure, responsive behavior, grid, cards, buttons, forms, tables, dialogs, badges, chips, navigation, and page hierarchy already present in the project.

This is a production-ready Pet Adoption Management System with multiple user roles.

--------------------------------------------------
USER ROLES
--------------------------------------------------

• Public Visitor
• Adopter
• Employee
• Vet
• Manager
• Admin

Each role should only see the pages that belong to it.

--------------------------------------------------
DESIGN REQUIREMENTS
--------------------------------------------------

Maintain consistency with the existing pages.

Create desktop-first responsive layouts.

Use realistic placeholder content.

Use reusable design components.

Create loading, empty, success, and error states where appropriate.

Use confirmation dialogs before destructive actions.

Use badges for statuses.

Use search, filters, sorting, pagination, and tables whenever appropriate.

Create reusable cards and detail pages.

--------------------------------------------------
CURRENT BACKEND PAGES
--------------------------------------------------

Public

- /pets
- /pets/:id
- /login
- /signup

Adopter

- /profile
- /my-requests
- /my-adoptions

Employee

- /staff/dashboard
- /staff/pets
- /staff/pets/:id
- /staff/adoption-requests
- /staff/adoptions

Vet

- /vet/pets
- /vet/pets/:id/medical
- /vet/pets/:id/vaccinations

Admin

- /admin/users
- /admin/roles

Do not recreate these if they already exist.
Only extend them where necessary to keep the design system complete.

--------------------------------------------------
NEW PAGES TO DESIGN
--------------------------------------------------

Authentication

- Google OAuth callback
- GitHub OAuth callback

--------------------------------------------------
CHAT MODULE
--------------------------------------------------

Adopter

/chats

Display:
- conversation list
- unread badges
- latest message preview
- online/offline status
- search conversations
- filters

/chats/:conversationId

Design a modern messaging interface containing:

- message bubbles
- timestamps
- read status
- typing indicator
- attachments placeholder
- message composer
- conversation info panel

Staff

/staff/chats

Inbox showing:

- assigned conversations
- waiting conversations
- archived conversations
- search
- filters
- priority badges

/staff/chats/:conversationId

Same chat interface with additional staff tools:

- assign employee
- close conversation
- reopen conversation
- conversation status
- adopter profile summary

--------------------------------------------------
NOTIFICATIONS
--------------------------------------------------

/notifications

Design a notification center with:

- unread/read sections
- filter by type
- mark as read
- mark all as read
- notification categories
- empty state

Notification examples:

- adoption approved
- adoption rejected
- new message
- inventory warning
- appointment reminder

--------------------------------------------------
MANAGER DASHBOARD
--------------------------------------------------

/manager/dashboard

Create a dashboard with:

- KPI cards
- pets available
- adoptions this month
- pending requests
- inventory alerts
- recent activity
- quick actions
- charts
- adoption trends

--------------------------------------------------
ANALYTICS
--------------------------------------------------

/manager/analytics

Create analytics pages with:

- line charts
- bar charts
- pie charts
- monthly adoption reports
- pet categories
- species statistics
- age distributions
- successful adoption rate
- filters
- export buttons

--------------------------------------------------
INVENTORY
--------------------------------------------------

/manager/inventory

Inventory management including:

- searchable table
- filters
- stock status
- category
- quantity
- minimum stock
- expiration date
- supplier
- actions

Include dialogs for:

- add item
- edit item
- delete item
- stock adjustment

--------------------------------------------------
ADMIN INVENTORY
--------------------------------------------------

/admin/inventory

Advanced inventory management using the same components with administrator controls.

--------------------------------------------------
SUPPLIERS
--------------------------------------------------

/admin/inventory/suppliers

Supplier management including:

- supplier list
- supplier details
- contact information
- supplied categories
- active/inactive status

Dialogs:

- add supplier
- edit supplier
- delete supplier

--------------------------------------------------
FILES
--------------------------------------------------

/admin/files

Create a file management interface.

Include:

- upload area
- drag-and-drop upload
- recent uploads
- previews
- image gallery
- document list
- search
- filters
- delete confirmation

--------------------------------------------------
REPORTS
--------------------------------------------------

/admin/reports

Design export pages with:

- report cards
- export options
- CSV
- PDF
- Excel
- date filters
- report history

--------------------------------------------------
SYSTEM ANALYTICS
--------------------------------------------------

/admin/analytics

Create an admin analytics dashboard including:

- total users
- active users
- role distribution
- pets
- adoptions
- chats
- storage usage
- uploads
- system health
- charts

--------------------------------------------------
ACTIVITY LOG
--------------------------------------------------

/admin/activity-log

Design an audit log page with:

- searchable table
- filters
- user
- action
- resource
- timestamp
- details drawer

--------------------------------------------------
COMMON COMPONENTS
--------------------------------------------------

If missing from the existing design system, also create reusable components:

- Empty states
- Error states
- Loading skeletons
- Confirmation dialogs
- Toast notifications
- Pagination
- Breadcrumbs
- Search bars
- Filter panels
- Charts
- KPI cards
- Tables
- Status badges
- Avatar groups
- Timeline components
- File upload component
- Notification cards
- Chat components
- Analytics widgets

--------------------------------------------------
BACKEND INTEGRATION
--------------------------------------------------

Design the pages according to these backend endpoints so every screen has the required UI for CRUD operations.

Chat APIs

GET    /conversations
POST   /conversations
GET    /conversations/:id
PATCH  /conversations/:id

GET    /conversations/:id/messages
POST   /conversations/:id/messages

PATCH  /messages/:id/read

Current Backend APIs

GET /pets
GET /pets/:id
POST /pets
PATCH /pets/:id
DELETE /pets/:id

GET /users
GET /users/:id
PATCH /users/:id
DELETE /users/:id

GET /users/profile
PATCH /users/profile

GET /adoption/requests
POST /adoption/requests/:id/approve
POST /adoption/requests/:id/reject
PATCH /adoption/requests/:id/cancel

GET /adoption/adoptions

GET /pets/:id/medical-record
POST /pets/:id/medical-record/entries
PATCH /medical-entries/:id
DELETE /medical-entries/:id

GET /pets/:id/vaccinations
POST /pets/:id/vaccinations
PATCH /vaccinations/:id
DELETE /vaccinations/:id

--------------------------------------------------
FINAL REQUIREMENT
--------------------------------------------------

This should feel like a complete enterprise SaaS application. Every new page must seamlessly match the existing theme, components, spacing, and interaction patterns already established in this Figma project. Do not replace or redesign existing screens—only extend the product with production-ready, high-fidelity designs that integrate naturally with the current design system.