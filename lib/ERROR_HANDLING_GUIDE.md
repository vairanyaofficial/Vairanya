# Error Handling Guide

यह application में centralized error handling system है जो आपको consistent और user-friendly error handling provide करता है।

## Features

1. **Centralized Error Handling** - सभी errors एक जगह handle होते हैं
2. **Automatic Retry** - Network और server errors के लिए automatic retry
3. **User-Friendly Messages** - Technical errors को user-friendly messages में convert करता है
4. **Error Types** - Different error types (Network, API, Auth, etc.) के लिए proper handling
5. **Toast Integration** - Automatic toast notifications

## Usage

### Basic Usage

```typescript
import { useErrorHandler } from "@/lib/error-context";
import { fetchWithErrorHandling, handleApiResponse } from "@/lib/error-handler";

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetchWithErrorHandling("/api/data");
      const result = await handleApiResponse(response);
      
      if (result.success) {
        // Use result.data
      } else {
        // Error automatically handled and shown in toast
        handleError(result.error);
      }
    } catch (error) {
      // Error automatically handled
      handleError(error);
    }
  };
}
```

### Using Hook for Async Operations

```typescript
import { useAsyncErrorHandler } from "@/lib/error-context";

function MyComponent() {
  const [fetchData, isLoading, error] = useAsyncErrorHandler(
    async (id: string) => {
      const response = await fetch(`/api/data/${id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    }
  );

  const handleClick = async () => {
    try {
      const data = await fetchData("123");
      // Use data
    } catch (err) {
      // Error already handled and shown in toast
    }
  };
}
```

### Manual Error Handling

```typescript
import { ErrorHandler, ErrorType } from "@/lib/error-handler";
import { useErrorHandler } from "@/lib/error-context";

function MyComponent() {
  const { handleError } = useErrorHandler();

  const processData = async () => {
    try {
      // Your code
    } catch (error) {
      const appError = ErrorHandler.parseApiError(error);
      const userMessage = ErrorHandler.getUserMessage(appError);
      
      // Show custom message
      handleError(error, false); // Don't show toast
      // Or show custom toast
      showError(userMessage);
    }
  };
}
```

## Error Types

- `NETWORK` - Internet connection issues
- `API` - API request errors
- `VALIDATION` - Input validation errors
- `AUTH` - Authentication errors
- `PERMISSION` - Permission denied errors
- `NOT_FOUND` - Resource not found
- `SERVER` - Server errors (500+)
- `UNKNOWN` - Unknown errors

## API Response Format

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: AppError }
```

## Retry Logic

`fetchWithErrorHandling` automatically retries:
- Network errors (up to 2 retries with exponential backoff)
- Server errors (500+) (up to 2 retries)
- Timeout errors (408, 429)

Does NOT retry:
- Client errors (400-499) except 408, 429
- Authentication errors (401)
- Permission errors (403)

## Best Practices

1. **Always use `fetchWithErrorHandling`** for API calls
2. **Use `handleApiResponse`** to parse responses
3. **Use `useAsyncErrorHandler` hook** for async operations
4. **Don't show manual error messages** - let the error handler do it
5. **Use `handleError` with `showToast: false`** if you want custom handling

## Example: Complete Component

```typescript
"use client";

import { useAsyncErrorHandler } from "@/lib/error-context";
import { fetchWithErrorHandling, handleApiResponse } from "@/lib/error-handler";
import { useState } from "react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  
  const [loadProducts, isLoading, error] = useAsyncErrorHandler(
    async () => {
      const response = await fetchWithErrorHandling("/api/products");
      const result = await handleApiResponse<{ products: any[] }>(response);
      
      if (!result.success) {
        throw result.error;
      }
      
      return result.data.products;
    }
  );

  const handleLoad = async () => {
    try {
      const data = await loadProducts();
      setProducts(data);
    } catch {
      // Error already handled
    }
  };

  return (
    <div>
      <button onClick={handleLoad} disabled={isLoading}>
        {isLoading ? "Loading..." : "Load Products"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {/* Products list */}
    </div>
  );
}
```

