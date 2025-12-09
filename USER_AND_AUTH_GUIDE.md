# User Roles & Protection Guide

This guide explains how to build a **Role-Based** application (e.g., School System, Marketplace) using the framework's authentication system.

The core concept is: **Keep the `User` model for login credentials, and use "Profiles" or "Groups" for application-specific roles.**

---

## 1. Designing "Custom Users" (Profiles)

If you need different types of users (Teacher, Student, Vendor, Customer) with different data, **do not modify the core User model**. Instead, create **Profile Models**.

### Usage Example: School App

You want:
*   **Teachers**: Have a `department` and `employeeID`.
*   **Students**: Have a `major` and `gpa`.

#### Step 1: Create the Models

Create `api/src/apps/school/models.ts`:

```typescript
import { Model } from '../../core/model';
import { CharField, IntegerField, ForeignKey } from '../../core/fields';
import { registerAdmin } from '../../core/adminRegistry';

@registerAdmin({
  displayName: 'Teachers',
  icon: 'briefcase',
  listDisplay: ['id', 'user', 'department']
})
export class Teacher extends Model {
  static getTableName() { return 'teachers'; }

  // Link to Core User (One-to-One)
  user = new ForeignKey('User', { unique: true, onDelete: 'CASCADE', relatedModel: 'User' });
  
  department = new CharField({ maxLength: 100 });
  employeeId = new CharField({ maxLength: 20 });
}

@registerAdmin({
  displayName: 'Students',
  icon: 'book',
  listDisplay: ['id', 'user', 'grade']
})
export class Student extends Model {
  static getTableName() { return 'students'; }

  user = new ForeignKey('User', { unique: true, onDelete: 'CASCADE', relatedModel: 'User' });
  
  grade = new IntegerField();
  major = new CharField({ maxLength: 100 });
}
```

---

## 2. API Protection (Backend Middleware)

How do you ensure **only a Teacher** can access a route? You need creating custom middleware.

### Step 1: Create the Guard Logic

Create `api/src/apps/school/middleware.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { Teacher, Student } from './models';
import { requireAuth } from '../../middleware/auth';

// Middleware: Ensures user is logged in AND is a Teacher
export async function requireTeacher(request: FastifyRequest, reply: FastifyReply) {
    // 1. First, ensure generic authentication
    await requireAuth(request, reply); 

    // 2. Check if a Teacher profile exists for this user
    const teacherProfile = await Teacher.objects.filter({ userId: request.user!.id }).first();
    
    if (!teacherProfile) {
        return reply.code(403).send({ 
            error: 'Access Denied', 
            message: 'You must be a Teacher to perform this action.' 
        });
    }

    // Optional: Attach the profile to the request for easier access later
    (request as any).teacher = teacherProfile;
}

// Middleware: Ensures user is logged in AND is a Student
export async function requireStudent(request: FastifyRequest, reply: FastifyReply) {
    await requireAuth(request, reply);
    
    const studentProfile = await Student.objects.filter({ userId: request.user!.id }).first();
    
    if (!studentProfile) {
        return reply.code(403).send({ error: 'Student access only.' });
    }
}
```

### Step 2: Protect Your Routes

In `api/src/apps/school/routes.ts`:

```typescript
import { requireTeacher, requireStudent } from './middleware';

export default async function schoolRoutes(fastify: FastifyInstance) {
    
    // Only Teachers can create courses
    fastify.post('/api/courses', {
        preHandler: requireTeacher 
    }, async (req, reply) => {
        const teacher = (req as any).teacher; // Accessed from middleware
        return { msg: `Course created by ${teacher.department}` };
    });

    // Only Students can enroll
    fastify.post('/api/enroll', {
        preHandler: requireStudent 
    }, async (req, reply) => {
        return { msg: 'Enrolled successfully' };
    });
}
```

---

## 3. Alternative: Using Groups (Simpler)

If you **don't** need extra data (like `gpa` or `department`) and just need a simple "Is this a Vendor?" check, use the built-in **Groups** system.

### Step 1: Create Groups in Admin
Go to the Admin Dashboard > Groups and create:
*   "Vendors"
*   "Customers"

### Step 2: Assign Users
Assign users to these groups via the User Edit page.

### Step 3: Check Group in Middleware

```typescript
export async function requireVendor(request: FastifyRequest, reply: FastifyReply) {
    await requireAuth(request, reply);
    
    // Assuming backend populates groups (if not, you might need to fetch them)
    // This is a conceptual example; your implementation might vary based on how 'user' is populated
    const userGroups = await UserGroup.objects.filter({ userId: request.user!.id }).all();
    // Then check if the group ID for "Vendor" is in the list
}
```

*Recommendation: For serious apps, use the **Profile** method (Section 1) as it's more robust.*

---

## 4. Full Authentication Flow for Custom Roles

Here is how the lifecycle works for a "Vendor" signup:

1.  **Register Core User**: Frontend calls `/auth/register` to create the login account (email/password).
2.  **Create Profile**:
    *   **Option A (Auto)**: On backend, listen for user creation and create an empty Vendor profile.
    *   **Option B (Manual)**: Frontend calls a second endpoint `/api/vendor/onboarding` immediately after login.
        *   This endpoint expects `{ companyName, taxId }`.
        *   It creates a `Vendor` record linked to `req.user.id`.

### Example Onboarding Endpoint

```typescript
// api/src/apps/marketplace/routes.ts

fastify.post('/api/vendor/onboarding', {
    preHandler: requireAuth // User must be logged in
}, async (req, reply) => {
    // Check if profile already exists
    const existing = await Vendor.objects.filter({ userId: req.user.id }).first();
    if (existing) return reply.code(400).send({ error: 'Already a vendor' });

    // Create the profile
    await Vendor.objects.create({
        userId: req.user.id,
        companyName: req.body.companyName,
        taxId: req.body.taxId
    });

    return { success: true };
});
```

---

## 5. Frontend Integration (Next.js)

### protecting Pages

In `admin/src/components/ProtectedRoute.tsx`, you usually check `user`. But for custom roles, you might need to fetch the profile.

**Best Practice**:
1.  Login (`useAuthStore.login`) gets the `User`.
2.  Immediately fetch the profile if needed.

**Example Component**:

```tsx
// src/components/TeacherRoute.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function TeacherRoute({ children }) {
  const { user, getToken } = useAuthStore();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        // Call an endpoint that checks if I am a teacher
        // Or simply GET /api/teachers/me
        await axios.get('http://localhost:8000/api/teachers/me', {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        setIsTeacher(true);
      } catch {
        setIsTeacher(false); // 404 or 403 means not a teacher
      } finally {
        setLoading(false);
      }
    };

    if (user) checkRole();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!isTeacher) return <div>Access Denied: Teachers Only</div>;

  return <>{children}</>;
}
```

---

## 6. API Documentation (Swagger)

The framework automatically generates API documentation at `http://localhost:8000/docs`.

**Note:** Accessing `/docs` requires **Basic Auth** (User: `admin`, Pass: `admin` — or as configured in your settings) to prevent public exposure.

### Documenting Your Routes

To make your endpoints appear in Swagger, add a `schema` object to your route configuration.

```typescript
fastify.post('/api/courses', {
    preHandler: requireTeacher,
    schema: {
        tags: ['Courses'],              // Groups endpoints in the UI
        summary: 'Create a new course', // Short description
        description: 'Allows a teacher to create a course with a title and description.',
        
        // Document the Request Body
        body: {
            type: 'object',
            required: ['title'],
            properties: {
                title: { type: 'string', example: 'Introduction to Physics' },
                description: { type: 'string' }
            }
        },

        // Document the Response
        response: {
            201: {
                description: 'Course created',
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    id: { type: 'integer' }
                }
            }
        },

        // Mark as requiring "Bearer Auth" (Padlock icon)
        security: [{ bearerAuth: [] }] 
    }
}, async (req, reply) => {
    // ... handler
});
```
