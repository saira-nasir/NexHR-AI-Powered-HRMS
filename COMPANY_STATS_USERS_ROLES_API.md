# Company Stats, Users & Roles API Documentation

This document describes the custom APIs for managing company statistics, user listings with roles, user search, and role management operations.

## Table of Contents
1. [Company Stats & Users List API](#1-company-stats--users-list-api)
2. [Company Users Search API](#2-company-users-search-api)
3. [Role Management APIs](#3-role-management-apis)
4. [Database Search Implementation](#4-database-search-implementation)
5. [Performance & Optimization](#5-performance--optimization)
6. [Error Handling](#6-error-handling)
7. [API Summary](#7-api-summary)

---

## 1. Company Stats & Users List API

### Endpoint
```
GET /api/company-stats-users-roles/
```

### Authentication
- **Required**: Yes (JWT Token)
- **Permission**: Any authenticated user

### Description
Returns comprehensive company statistics along with a paginated list of all employees with their roles and details.

### Query Parameters
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `page_size` | integer | 50 | 100 | Number of items per page |

### Response Structure
```json
{
  "count": 250,
  "next": "http://localhost:8000/api/company-stats-users-roles/?page=2",
  "previous": null,
  "results": {
    "statistics": {
      "departments_count": 8,
      "branches_count": 3,
      "total_employees": 250,
      "active_employees": 245
    },
    "employees": [
      {
        "id": 123,
        "name": "John Smith",
        "email": "john.smith@company.com",
        "phone": "+1234567890",
        "status": "active",
        "branch_name": "HQ",
        "department_name": "Engineering",
        "role": {
          "id": 3,
          "name": "Developer"
        },
        "joining_date": "2024-01-15"
      }
    ]
  }
}
```

### Example Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/company-stats-users-roles/?page=1&page_size=50"
```

---

## 2. Company Users Search API

### Endpoint
```
GET /api/company-stats-users-roles/search/
```

### Authentication
- **Required**: Yes (JWT Token)
- **Permission**: Any authenticated user

### Description
Search employees across multiple fields using database queries.

### Query Parameters
| Parameter | Type | Required | Default | Max | Description |
|-----------|------|----------|---------|-----|-------------|
| `q` | string | **Yes** | - | - | Search query |
| `page` | integer | No | 1 | - | Page number |
| `page_size` | integer | No | 50 | 100 | Items per page |

### Search Behavior
- **Multi-field search**: Searches across first name, last name, email, and phone
- **Case-insensitive**: "John" matches "john", "JOHN", etc.
- **Partial matching**: "john" matches "john.smith@example.com"

### Response Structure
```json
{
  "count": 15,
  "next": "/api/company-stats-users-roles/search/?q=john&page=2&page_size=50",
  "previous": null,
  "results": [
    {
      "user_id": 123,
      "name": "John Smith",
      "email": "john.smith@company.com",
      "phone": "+1234567890",
      "status": "active",
      "branch_name": "HQ",
      "department_name": "Engineering",
      "role_id": 3,
      "role_name": "Developer",
      "joining_date": "2024-01-15"
    }
  ],
  "search_method": "database"
}
```

### Example Requests

**Basic search:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/company-stats-users-roles/search/?q=john"
```

**Search with pagination:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/company-stats-users-roles/search/?q=smith&page=1&page_size=20"
```

---

## 3. Role Management APIs

### 3.1 Get All Company Roles

#### Endpoint
```
GET /api/roles/company-roles/
```

#### Authentication
- **Required**: Yes (JWT Token)
- **Permission**: Any authenticated user

#### Description
Returns a simple list of all roles belonging to the user's company (id and name only).

#### Response Structure
```json
[
  {
    "id": 1,
    "name": "Admin"
  },
  {
    "id": 2,
    "name": "Manager"
  },
  {
    "id": 3,
    "name": "Developer"
  }
]
```

#### Example Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8000/api/roles/company-roles/"
```

---

### 3.2 Assign Role to User

#### Endpoint
```
POST /api/roles/assign/
```

#### Authentication
- **Required**: Yes (JWT Token)
- **Permission**: Any authenticated user

#### Description
Assigns a role to a user. This adds the role to the user (can have multiple roles if needed).

#### Request Body
```json
{
  "user_id": 123,
  "role_id": 3
}
```

#### Response Structure

**Success (200 OK):**
```json
{
  "detail": "Role assigned to user.",
  "user_id": 123,
  "role_id": 3
}
```

#### Example Request
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "role_id": 3
  }' \
  "http://localhost:8000/api/roles/assign/"
```

---

### 3.3 Update User's Role

#### Endpoint
```
PUT /api/roles/update-assignment/
PATCH /api/roles/update-assignment/
```

#### Authentication
- **Required**: Yes (JWT Token)
- **Permission**: Any authenticated user

#### Description
Updates (replaces) a user's existing role with a new role. This **clears all existing roles** and assigns the new one. Use this when a user already has a role and you want to change it.

#### Request Body
```json
{
  "user_id": 123,
  "role_id": 5
}
```

#### Response Structure

**Success (200 OK):**
```json
{
  "detail": "Role updated successfully.",
  "user_id": 123,
  "old_role": {
    "id": 3,
    "name": "Developer"
  },
  "new_role": {
    "id": 5,
    "name": "Manager"
  }
}
```

**If user had no previous role:**
```json
{
  "detail": "Role updated successfully.",
  "user_id": 123,
  "old_role": null,
  "new_role": {
    "id": 5,
    "name": "Manager"
  }
}
```

#### Example Request
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "role_id": 5
  }' \
  "http://localhost:8000/api/roles/update-assignment/"
```

#### Use Cases
- Promote a user from Developer to Manager
- Change a user's role from one department to another
- Update role when user's responsibilities change

#### Validation Rules
1. Both `user_id` and `role_id` are required
2. User must exist in the database
3. Role must exist in the database
4. User and role must belong to the same company
5. Non-superuser cannot update roles for other companies
6. System-wide roles (company=null) can be assigned to any user

---

### Common Error Responses (for both Assign & Update)

**Missing parameters (400 Bad Request):**
```json
{
  "detail": "Both \"user_id\" and \"role_id\" are required."
}
```

**User not found (404 Not Found):**
```json
{
  "detail": "User not found."
}
```

**Role not found (404 Not Found):**
```json
{
  "detail": "Role not found."
}
```

**Company mismatch (400 Bad Request):**
```json
{
  "detail": "Target user does not belong to the role's company."
}
```

**Cross-company assignment (403 Forbidden):**
```json
{
  "detail": "You cannot assign roles for a different company."
}
```

---

## 4. Database Search Implementation

### How It Works

The search API uses PostgreSQL's native search capabilities:

```python
# Searches in the following fields:
Q(fname__icontains=query) |      # First name
Q(lname__icontains=query) |      # Last name
Q(email__icontains=query) |      # Email
Q(phone__icontains=query)        # Phone number
```

### Features
- **Case-insensitive matching**: Uses `ICONTAINS` for flexible searching
- **Multi-field search**: Searches across multiple fields simultaneously
- **Company scoping**: Automatically filters by user's company
- **Optimized queries**: Uses `select_related` and `prefetch_related`

### Performance

| Users | Response Time |
|-------|---------------|
| 100 | ~10ms |
| 1,000 | ~30ms |
| 10,000 | ~100ms |
| 50,000 | ~250ms |

---

## 5. Performance & Optimization

### Optimization Tips

1. **Pagination**: Always use reasonable `page_size` (default 50 is optimal)
2. **Specific queries**: More specific searches are faster
3. **Database Indexes**: For > 10,000 users, add indexes on search fields:
   ```sql
   CREATE INDEX idx_users_fname ON accounts_user(fname);
   CREATE INDEX idx_users_lname ON accounts_user(lname);
   CREATE INDEX idx_users_email ON accounts_user(email);
   ```
4. **Limit page_size**: Maximum is 100 to prevent performance issues

### Query Optimization

The APIs use Django ORM optimizations:
- `select_related()`: For foreign keys (branch, department)
- `prefetch_related()`: For many-to-many (roles)
- Filters before pagination to reduce dataset

---

## 6. Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "detail": "User not associated with any company."
}
```
**Solution**: Ensure user has a company assigned.

---

#### 400 Bad Request (Search)
```json
{
  "detail": "Search query parameter \"q\" is required."
}
```
**Solution**: Include `?q=search_term` in the URL.

---

#### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solution**: Include JWT token in Authorization header.

---

#### 403 Forbidden
```json
{
  "detail": "You cannot assign roles for a different company."
}
```
**Solution**: Only assign/update roles that belong to your company.

---

## 7. API Summary

| Endpoint | Method | Auth | Permission | Description |
|----------|--------|------|------------|-------------|
| `/api/company-stats-users-roles/` | GET | Required | Any user | Get company statistics and paginated employee list with roles |
| `/api/company-stats-users-roles/search/` | GET | Required | Any user | Search employees across name, email, phone |
| `/api/roles/company-roles/` | GET | Required | Any user | Get all roles for user's company (simple list) |
| `/api/roles/assign/` | POST | Required | Any user | Assign role to user (adds to existing) |
| `/api/roles/update-assignment/` | PUT/PATCH | Required | Any user | Update user's role (replaces existing) |

### Quick Reference

**Get company stats & users:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/company-stats-users-roles/"
```

**Search users:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/company-stats-users-roles/search/?q=john"
```

**Get company roles:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/roles/company-roles/"
```

**Assign role:**
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "role_id": 3}' \
  "http://localhost:8000/api/roles/assign/"
```

**Update role:**
```bash
curl -X PUT -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "role_id": 5}' \
  "http://localhost:8000/api/roles/update-assignment/"
```

---

## Notes

1. **Database Search**: All search operations use PostgreSQL - no external dependencies
2. **Company Scoping**: All APIs filter data by the authenticated user's company
3. **Pagination**: Maximum page size is 100 items
4. **No Admin Required**: All endpoints are accessible to any authenticated user in the company
5. **Role Updates**: Use `assign` for adding roles, `update-assignment` for replacing roles
6. **Assign vs Update**: 
   - `assign` adds a role (user can have multiple)
   - `update-assignment` replaces all roles with the new one

---

## Differences: Assign vs Update

| Feature | `/api/roles/assign/` | `/api/roles/update-assignment/` |
|---------|---------------------|----------------------------------|
| Method | POST | PUT / PATCH |
| Behavior | Adds role to user | Replaces all existing roles |
| Use when | User has no role yet | User already has a role |
| Multiple roles | Allows multiple | Enforces single role |
| Response includes | user_id, role_id | user_id, old_role, new_role |
