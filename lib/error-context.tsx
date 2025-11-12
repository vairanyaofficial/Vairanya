// lib/error-context.tsx
// React context for centralized error handling

"use client";

import React, { createContext, useContext, useCallback, useState, ReactNode } from "react";
import { ErrorHandler, AppError, ErrorType } from "./error-handler";
import { useToast } from "@/components/ToastProvider";

interface ErrorContextValue {
  handleError: (error: any, showToast?: boolean) => AppError;
  clearError: () => void;
  currentError: AppError | null;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const { showError, showSuccess } = useToast();

  const handleError = useCallback(
    (error: any, showToast: boolean = true): AppError => {
      const appError = ErrorHandler.parseApiError(error);
      setCurrentError(appError);

      if (showToast) {
        const userMessage = ErrorHandler.getUserMessage(appError);
        showError(userMessage);
      }

      // Log error in development
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error handled:", ErrorHandler.formatForLogging(appError));
      }

      return appError;
    },
    [showError]
  );

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ handleError, clearError, currentError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorHandler() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorHandler must be used within ErrorProvider");
  }
  return context;
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncErrorHandler<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T
): [T, boolean, AppError | null] {
  const { handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const wrappedFn = useCallback(
    async (...args: Parameters<T>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        const appError = handleError(err, true);
        setError(appError);
        throw appError;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, handleError]
  ) as T;

  return [wrappedFn, isLoading, error];
}

