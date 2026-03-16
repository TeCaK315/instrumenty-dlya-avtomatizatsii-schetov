import { NextResponse } from 'next/server';
import { createClient as _createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabaseAdmin: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = _createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

/**
 * Custom API Error with status code
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message: string = 'Bad request', details?: unknown) {
    return new ApiError(message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Not found') {
    return new ApiError(message, 404);
  }

  static tooManyRequests(message: string = 'Too many requests') {
    return new ApiError(message, 429);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(message, 500);
  }
}

/**
 * Handle API errors and return proper NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }

  console.error('Unknown error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Require authenticated user or throw ApiError
 * Returns the authenticated user object
 */
export async function requireAuth() {
  const supabase = getSupabase();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw ApiError.unauthorized('Authentication required');
  }

  return { user, supabase };
}

/**
 * Wrap an API handler with automatic error handling
 */
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
