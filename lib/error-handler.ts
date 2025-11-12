// lib/error-handler.ts
// Centralized error handling utility

export enum ErrorType {
  NETWORK = "NETWORK",
  API = "API",
  VALIDATION = "VALIDATION",
  AUTH = "AUTH",
  PERMISSION = "PERMISSION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string | number;
  details?: any;
  retryable?: boolean;
  statusCode?: number;
}

export class ErrorHandler {
  /**
   * Parse error from API response
   */
  static parseApiError(error: any): AppError {
    // Network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        type: ErrorType.NETWORK,
        message: "Network error. Please check your internet connection.",
        retryable: true,
      };
    }

    // API response errors
    if (error?.response) {
      const status = error.response.status;
      const data = error.response.data || error.response;

      return {
        type: this.getErrorTypeFromStatus(status),
        message: data.error || data.message || "An error occurred",
        code: data.code,
        details: data.details,
        statusCode: status,
        retryable: status >= 500 || status === 408 || status === 429,
      };
    }

    // Error with status code
    if (error?.status) {
      return {
        type: this.getErrorTypeFromStatus(error.status),
        message: error.message || error.error || "An error occurred",
        statusCode: error.status,
        retryable: error.status >= 500,
      };
    }

    // Standard Error object
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message || "An unexpected error occurred",
        details: error.stack,
      };
    }

    // String errors
    if (typeof error === "string") {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
      };
    }

    // Default
    return {
      type: ErrorType.UNKNOWN,
      message: "An unexpected error occurred",
      details: error,
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError | any): string {
    const appError = error.type ? error : this.parseApiError(error);

    switch (appError.type) {
      case ErrorType.NETWORK:
        return "Connection problem. Please check your internet and try again.";
      
      case ErrorType.AUTH:
        return "Authentication failed. Please log in again.";
      
      case ErrorType.PERMISSION:
        return "You don't have permission to perform this action.";
      
      case ErrorType.NOT_FOUND:
        return "The requested resource was not found.";
      
      case ErrorType.VALIDATION:
        return appError.message || "Please check your input and try again.";
      
      case ErrorType.SERVER:
        return "Server error. Please try again later or contact support.";
      
      case ErrorType.API:
        return appError.message || "An error occurred. Please try again.";
      
      default:
        return appError.message || "Something went wrong. Please try again.";
    }
  }

  /**
   * Get error type from HTTP status code
   */
  private static getErrorTypeFromStatus(status: number): ErrorType {
    if (status >= 500) return ErrorType.SERVER;
    if (status === 401) return ErrorType.AUTH;
    if (status === 403) return ErrorType.PERMISSION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status === 400 || status === 422) return ErrorType.VALIDATION;
    if (status >= 400) return ErrorType.API;
    return ErrorType.UNKNOWN;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError | any): boolean {
    const appError = error.type ? error : this.parseApiError(error);
    return appError.retryable ?? false;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: AppError | any): string {
    const appError = error.type ? error : this.parseApiError(error);
    return JSON.stringify({
      type: appError.type,
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details,
    }, null, 2);
  }
}

/**
 * API fetch wrapper with error handling and retry
 */
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  retries: number = 2
): Promise<Response> {
  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If successful, return response
      if (response.ok) {
        return response;
      }

      // Parse error response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      const error = ErrorHandler.parseApiError({
        response: {
          status: response.status,
          data: errorData,
        },
      });

      // Don't retry on client errors (4xx) except 408, 429
      if (response.status < 500 && response.status !== 408 && response.status !== 429) {
        throw error;
      }

      // Retry on server errors
      if (attempt < retries && ErrorHandler.isRetryable(error)) {
        lastError = error;
        // Exponential backoff: wait 1s, 2s, 4s...
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw error;
    } catch (error) {
      lastError = error;

      // Don't retry on network errors if it's the last attempt
      if (attempt === retries) {
        break;
      }

      // Retry network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      // Don't retry other errors
      throw error;
    }
  }

  throw lastError;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Handle API response with error parsing
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      const error = ErrorHandler.parseApiError({
        response: {
          status: response.status,
          data: errorData,
        },
      });

      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, data: data as T };
  } catch (error) {
    const appError = ErrorHandler.parseApiError(error);
    return { success: false, error: appError };
  }
}

