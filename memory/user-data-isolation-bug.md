---
name: user-data-isolation-bug
description: Auth controller endpoints expose all user data to any authenticated user
metadata:
  type: feedback
---

In the auth.controller.js file, the user management endpoints (list, get, update, archive) are accessible to ANY authenticated user without any role checking, allowing:

1. Any authenticated user to list all users' information (exposing emails, names, roles, etc.) - `/api/auth` endpoint
2. Any authenticated user to get any other user's profile information - `/api/auth/:id` endpoint  
3. Any authenticated user to update any other user's information - `/api/auth/:id` endpoint
4. Any authenticated user to delete any other user's account - `/api/auth/:id` endpoint

This is a serious authentication/authorization bug where user 1's data is showing to and can be modified by user 2.

The endpoints should be restricted to admin users only by checking the user's role from the session (which is available as req.user.role after login).

**Why**: Missing role-based access control on user management endpoints
**How to apply**: Add role checking middleware or inline checks to verify req.user.role === 'admin' before allowing access to these endpoints