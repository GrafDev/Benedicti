---
name: firebase-cloud-expert
description: Expert guide for Firebase implementation in the language learning app. Use this skill for database modeling, authentication, security rules, and hosting configuration.
---

# Firebase Cloud Expert

This skill handles the backend-as-a-service infrastructure using Firebase.

## Firestore Data Modeling

### Collections & Schemas

1.  **`users`** (Collection)
    *   `uid` (Document ID): The user's Firebase Auth UID.
    *   **Fields**:
        *   `email`: string
        *   `displayName`: string
        *   `createdAt`: timestamp
        *   `settings`: map (language preferences, daily goals)
    *   **Sub-collections**:
        *   `dictionaries`: User's personal dictionaries.
        *   `stats`: Aggregated learning statistics.

2.  **`users/{uid}/dictionaries`** (Sub-collection)
    *   `id` (Auto-ID)
    *   **Fields**:
        *   `name`: string (e.g., "My Spanish Words")
        *   `sourceLang`: string (ISO code, e.g., 'en')
        *   `targetLang`: string (ISO code, e.g., 'es')
        *   `wordCount`: number
        *   `updatedAt`: timestamp

3.  **`users/{uid}/dictionaries/{dictId}/words`** (Sub-collection)
    *   `id` (Auto-ID)
    *   **Fields**:
        *   `original`: string
        *   `translation`: string
        *   `example`: string (optional)
        *   `box`: number (0-5, Leitner system box)
        *   `nextReview`: timestamp
        *   `difficulty`: number (0.0 - 1.0)

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
      
      match /dictionaries/{dictId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
      
      match /dictionaries/{dictId}/words/{wordId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }
  }
}
```

## Authentication

*   **Primary Method**: Google Data Sign-in (`GoogleAuthProvider`).
*   **Secondary Method**: Email/Password (`createUserWithEmailAndPassword`).
*   **Persistence**: `browserLocalPersistence`.

## Hosting

*   **Single Page App**: Rewrite all URLs to `/index.html`.
*   **Caching**: Set `Cache-Control` headers for immutable assets (hashed).
