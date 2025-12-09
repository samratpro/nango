# Rate Limiting Guide

The API server comes with built-in rate limiting to protect against abuse and DDOS attacks.

## 1. Global Rate Limits

By default, the server limits **500 requests per minute** per IP address.

### Reducing or Increasing the Limit
To change this global setting, edit `api/src/index.ts`:

```typescript
// api/src/index.ts

// Find this block:
await fastify.register(rateLimit, {
  max: 500,              // <--- Change this number (Default: 500)
  timeWindow: '1 minute'
});
```

*   **For Development**: Recommend increasing to `1000` to avoid hitting limits while refreshing pages.
*   **For Production**: `100` to `300` is usually safe for public APIs.

## 2. Route-Specific Limits

Certain sensitive sensitive routes (like Login/Register) have stricter limits to prevent brute-force attacks.

### Example: Strict Login Limit
In `api/src/apps/auth/routes.ts`:

```typescript
fastify.post('/auth/login', {
    config: { 
        rateLimit: { max: 5, timeWindow: '1 minute' } // Only 5 tries per minute
    },
    // ...
```

### Disabling Limit for specific route
If you have an endpoint that needs to be called very frequently (e.g., a real-time status check), you can adjust it individually:

```typescript
fastify.get('/api/status', {
    config: { 
        rateLimit: { max: 5000, timeWindow: '1 minute' } 
    }
}, handler);
```

## 3. Handling Rate Limit Errors

When a user hits the limit, the API returns:
*   **Status Code**: `429 Too Many Requests`
*   **Response**: `{ "statusCode": 429, "error": "Too Many Requests", "message": "Rate limit exceeded, retry in 1 minute" }`

Your frontend should handle this gracefully (e.g., showing a "Please wait" message).
