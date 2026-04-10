# ArcticLogistics - Backend Architecture

## Folder Structure
```
/app
  /api
    /auth
      /login
      /register
      /profile
    /users
      /route.ts (GET list, POST create)
      /[id]
        /route.ts (GET, PATCH, DELETE)
        /validate (PATCH status)
        /role (PATCH role)
    /orders
      /route.ts (GET list, POST create)
      /[id]
        /route.ts (GET, PATCH)
        /cancel (PATCH status)
/lib
  /supabase.ts (Client initialization)
  /utils.ts (Helpers)
/services
  /user.service.ts (Business logic for users)
  /order.service.ts (Business logic for orders)
/repositories
  /user.repository.ts (Direct DB access for users)
  /order.repository.ts (Direct DB access for orders)
/types
  /database.types.ts (Generated Supabase types)
```

## Authorization Logic
- **Middleware**: A Next.js middleware will check the session and user status.
- **RLS**: The primary security layer is in the database.
- **Service Layer**: Additional checks (e.g., "Only ACTIVE users can create orders") are enforced in the `order.service.ts`.

## Example Endpoints

### Orders
- `POST /api/orders`: Creates a new order. Checks if user is ACTIVE.
- `GET /api/orders`: Returns orders. Users see their own, Admins see all.
- `PATCH /api/orders/[id]/cancel`: Cancels an order if it belongs to the user or if user is Admin.

### Users
- `GET /api/users`: List all users (Admin only).
- `PATCH /api/users/[id]/validate`: Change status to ACTIVE (Admin only).
