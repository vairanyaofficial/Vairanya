# Error Handling कैसे Use करें

## 📁 Files कहाँ हैं?

Error handling system यहाँ है:
- `lib/error-handler.ts` - Core error handling functions
- `lib/error-context.tsx` - React hooks और context

## 🚀 Quick Start

### Method 1: Hook Use करें (सबसे आसान)

```typescript
"use client";

import { useAsyncErrorHandler } from "@/lib/error-context";
import { fetchWithErrorHandling, handleApiResponse } from "@/lib/error-handler";

export default function MyComponent() {
  // Hook use करें - automatic error handling
  const [fetchData, isLoading, error] = useAsyncErrorHandler(
    async () => {
      const response = await fetchWithErrorHandling("/api/admin/products");
      const result = await handleApiResponse(response);
      if (!result.success) throw result.error;
      return result.data;
    }
  );

  const handleLoad = async () => {
    try {
      const data = await fetchData();
      // Data use करें
    } catch {
      // Error automatically handle हो गया, toast show हो गया
    }
  };

  return (
    <button onClick={handleLoad} disabled={isLoading}>
      {isLoading ? "Loading..." : "Load Data"}
    </button>
  );
}
```

### Method 2: Manual Error Handling

```typescript
"use client";

import { useErrorHandler } from "@/lib/error-context";
import { fetchWithErrorHandling, handleApiResponse } from "@/lib/error-handler";

export default function MyComponent() {
  const { handleError } = useErrorHandler();

  const loadData = async () => {
    try {
      const response = await fetchWithErrorHandling("/api/admin/products");
      const result = await handleApiResponse(response);
      
      if (result.success) {
        // Use result.data
      } else {
        handleError(result.error); // Toast automatically show होगा
      }
    } catch (error) {
      handleError(error); // Toast automatically show होगा
    }
  };

  return <button onClick={loadData}>Load</button>;
}
```

## 📝 Real Example - Admin Products Page

```typescript
"use client";

import { useAsyncErrorHandler } from "@/lib/error-context";
import { fetchWithErrorHandling, handleApiResponse } from "@/lib/error-handler";
import { getAdminSession } from "@/lib/admin-auth";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);

  // Hook use करें
  const [loadProducts, isLoading, error] = useAsyncErrorHandler(
    async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetchWithErrorHandling("/api/admin/products", {
        headers: {
          "x-admin-username": session.username,
          "x-admin-role": session.role,
        },
      });

      const result = await handleApiResponse(response);
      if (!result.success) throw result.error;
      
      return result.data.products || [];
    }
  );

  useEffect(() => {
    loadProducts().then(setProducts).catch(() => {
      // Error already handled, toast shown
    });
  }, []);

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error.message}</p>}
      {/* Products list */}
    </div>
  );
}
```

## 🎯 Key Functions

### 1. `useErrorHandler()` Hook
```typescript
const { handleError, clearError, currentError } = useErrorHandler();

// Error handle करें
handleError(error); // Toast automatically show होगा
```

### 2. `useAsyncErrorHandler()` Hook
```typescript
const [asyncFn, isLoading, error] = useAsyncErrorHandler(
  async (param1, param2) => {
    // Your async code
    return result;
  }
);

// Use करें
const result = await asyncFn("param1", "param2");
```

### 3. `fetchWithErrorHandling()`
```typescript
// Automatic retry के साथ fetch
const response = await fetchWithErrorHandling("/api/data", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### 4. `handleApiResponse()`
```typescript
const result = await handleApiResponse(response);

if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## ✅ Benefits

1. **Automatic Toast** - Error automatically toast में show होता है
2. **Retry Logic** - Network errors automatically retry होते हैं
3. **User-Friendly Messages** - Technical errors को simple messages में convert करता है
4. **Type Safe** - TypeScript support
5. **Consistent** - सभी जगह same error handling

## 🔄 Old Code vs New Code

### Old Way (Manual):
```typescript
try {
  const response = await fetch("/api/products");
  const data = await response.json();
  if (!data.success) {
    setError(data.error);
    showError(data.error);
  }
} catch (err) {
  setError("Failed to load");
  showError("Failed to load");
}
```

### New Way (Automatic):
```typescript
const [loadProducts, isLoading, error] = useAsyncErrorHandler(
  async () => {
    const response = await fetchWithErrorHandling("/api/products");
    const result = await handleApiResponse(response);
    if (!result.success) throw result.error;
    return result.data;
  }
);

// Use करें
await loadProducts(); // Error automatically handle होगा!
```

## 📍 Import Paths

```typescript
// Hooks
import { useErrorHandler, useAsyncErrorHandler } from "@/lib/error-context";

// Functions
import { 
  fetchWithErrorHandling, 
  handleApiResponse,
  ErrorHandler 
} from "@/lib/error-handler";
```

