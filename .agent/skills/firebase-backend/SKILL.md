---
name: firebase-backend
description: Expert guidance on Firebase project setup, Firestore data modeling, and security rules. Use this skill when designing database schemas, implementing authentication flows, or writing security rules for user data access.
---

# Firebase Backend Specialist

## Overview

This skill ensures a secure, scalable, and cost-effective Firebase implementation. It focuses on Firestore NoSQL design patterns and strict security rules.

## Core Capabilities

### 1. Firestore Data Modeling

Design for the queries you need, not normalized data.

- **Collections**:
  - `users/{uid}`: Authenticated user data.
  - `users/{uid}/dictionaries/{dictId}`: Subcollection for user-specific data (avoids large monolithic docs).
  - `public_dictionaries/{dictId}`: Shared content.
- **Denormalization**: Prefer duplication over complex joins. 

### 2. Security Rules per Role

Implement strict Role-Based Access Control (RBAC).

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /dictionaries/{dictId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. Cloud Functions (Triggers)

Use for background processing.

- **onCreate**: Send welcome email.
- **onDelete**: Cleanup related data (cascade delete).
- **onUpdate**: Update denormalized stats (e.g., total word count).

## When to Use

- **Schema Design**: Before writing code, use this skill to define the data structure.
- **Security Audit**: Use this to review `firestore.rules`.
- **Backend Logic**: When client-side logic is insecure or complex (e.g., payment verification), use Cloud Functions.
