import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma/client";
import { 
  powraSchema,
  jobDescriptionSchema,
  stopSchema,
  thinkSchema,
  actSchema,
  reviewSchema
} from "../../dashboard/forms/powra/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

async function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          console.log(`Getting cookie ${name}:`, cookie?.value ? "Present" : "Not found");
          return cookie?.value;
        },
        set(name: string, value: string, options: any) {
          console.log(`Setting cookie ${name}`);
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          console.log(`Removing cookie ${name}`);
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}

export async function POST(request: Request) {
  console.log("Starting POST request to /api/powra");
  console.log("Request headers:", Object.fromEntries(request.headers));
  console.log("Auth cookie present:", !!request.headers.get('cookie')?.includes('sb-'));
  
  try {
    // 1. Authentication Check
    let user;
    try {
      console.log("Initializing Supabase server client...");
      const supabase = await createSupabaseServer();
      
      console.log("Checking authentication state...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error("No session found");
        throw new Error("No active session");
      }
      
      if (!session.user) {
        console.error("Session exists but no user found");
        throw new Error("Invalid session state");
      }

      user = session.user;
      console.log("Authentication successful - User ID:", user.id);
      console.log("Access token present:", !!session.access_token);
    } catch (error: any) {
      console.error("Authentication failed:", error);
      console.error("Auth error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Authentication failed", 
          details: error?.message || "Unknown authentication error",
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 401 }
      );
    }

    // 2. Request Body Parsing
    let body;
    try {
      const text = await request.text();
      console.log("Raw request body length:", text.length);
      console.log("Request body preview:", text.substring(0, 100) + "...");
      
      try {
        body = JSON.parse(text);
        console.log("Successfully parsed JSON data");
        console.log("Parsed data structure:", Object.keys(body));
      } catch (jsonError: any) {
        console.error("JSON parsing failed:", jsonError);
        console.error("Invalid JSON content preview:", text.substring(0, 100));
        throw new Error(`Invalid JSON format: ${jsonError.message}`);
      }
    } catch (error: any) {
      console.error("Request body parsing failed:", error);
      console.error("Parse error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Invalid request format", 
          details: error?.message || "Failed to parse request body",
          preview: error?.preview
        },
        { status: 400 }
      );
    }
    
    // 3. Data Validation
    let validatedData;
    try {
      console.log("Starting schema validation...");
      console.log("Validating against schema:", Object.keys(powraSchema.shape));
      
      // Pre-validate the date field
      if (body.jobDescription?.date) {
        try {
          body.jobDescription.date = new Date(body.jobDescription.date);
          console.log("Date parsed successfully:", body.jobDescription.date);
        } catch (dateError) {
          console.error("Date parsing failed:", dateError);
          throw new Error("Invalid date format");
        }
      }

      // Log the data being validated
      console.log("Job Description:", JSON.stringify(body.jobDescription, null, 2));
      console.log("Stop Details:", JSON.stringify(body.stop, null, 2));
      console.log("Think Details:", JSON.stringify(body.think, null, 2));
      console.log("Act Details:", JSON.stringify(body.act, null, 2));
      console.log("Review Details:", JSON.stringify(body.review, null, 2));

      // Validate each section separately for better error reporting
      const validSections = {
        jobDescription: jobDescriptionSchema.parse(body.jobDescription),
        stop: stopSchema.parse(body.stop),
        think: thinkSchema.parse(body.think),
        act: actSchema.parse(body.act),
        review: reviewSchema.parse(body.review)
      };

      // Combine validated sections
      validatedData = validSections;
      console.log("Schema validation successful");
      console.log("Validated data structure:", Object.keys(validatedData));
    } catch (error: any) {
      console.error("Schema validation failed:", error);
      console.error("Validation error details:", {
        name: error.name,
        message: error.message,
        errors: error.errors,
        code: error.code
      });

      // Format validation errors for better debugging
      const formattedErrors = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
        received: err.received
      }));

      return NextResponse.json({
        error: "Validation failed",
        message: error.message,
        details: formattedErrors || error.errors,
        receivedData: {
          jobDescription: body.jobDescription,
          stop: body.stop,
          think: body.think,
          act: body.act,
          review: body.review
        }
      }, { status: 400 });
    }

    // 4. Data Preparation
    console.log("Preparing data for database insertion");
    const jobDescriptionJson = {
      ...validatedData.jobDescription,
      date: new Date(validatedData.jobDescription.date).toISOString(),
    };
    console.log("Prepared job description:", jobDescriptionJson);

    // 5. Database Operation
    try {
      console.log("Checking database connection...");
      console.log("Database URL configured:", !!process.env.DATABASE_URL);
      console.log("Direct URL configured:", !!process.env.DIRECT_URL);
      
      console.log("Creating POWRA record...");
      console.log("User ID:", user.id);
      console.log("Job Description:", JSON.stringify(jobDescriptionJson, null, 2));
      console.log("Stop Details:", JSON.stringify(validatedData.stop, null, 2));
      console.log("Think Details:", JSON.stringify(validatedData.think, null, 2));
      console.log("Act Details:", JSON.stringify(validatedData.act, null, 2));
      console.log("Review Details:", JSON.stringify(validatedData.review, null, 2));

      // Ensure all JSON fields are properly stringified
      const data = {
        userId: user.id,
        jobDescription: JSON.stringify(jobDescriptionJson),
        stopDetails: JSON.stringify(validatedData.stop),
        thinkDetails: JSON.stringify(validatedData.think),
        actDetails: JSON.stringify(validatedData.act),
        reviewDetails: JSON.stringify(validatedData.review),
      } satisfies Prisma.POWRAUncheckedCreateInput;

      console.log("Final data structure:", data);

      // Use a transaction for atomicity
      const powra = await prisma.$transaction(async (tx) => {
        console.log("Starting database transaction...");
        
        // Test connection with a simple query
        try {
          await tx.$queryRaw`SELECT 1`;
          console.log("Database connection test successful");
        } catch (connError: any) {
          console.error("Database connection test failed:", connError);
          throw new Error(`Database connection failed: ${connError.message}`);
        }

        // Create the POWRA record
        try {
          console.log("Creating POWRA record in transaction...");
          const record = await tx.pOWRA.create({ data });
          console.log("POWRA record created in transaction");
          return record;
        } catch (createError: any) {
          console.error("Failed to create POWRA record:", createError);
          if (createError instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors
            switch (createError.code) {
              case 'P2002':
                throw new Error('Unique constraint violation');
              case 'P2003':
                throw new Error('Foreign key constraint violation');
              case 'P2025':
                throw new Error('Record not found');
              default:
                throw new Error(`Database error: ${createError.message}`);
            }
          }
          throw createError;
        }
      }, {
        maxWait: 10000, // 10s max wait time
        timeout: 30000, // 30s timeout
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      });
      
      console.log("Transaction completed successfully");
      console.log("New record details:", {
        id: powra.id,
        createdAt: powra.createdAt,
        userId: powra.userId
      });

      return NextResponse.json({ 
        message: "POWRA created successfully",
        id: powra.id,
        timestamp: powra.createdAt.toISOString()
      }, { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-POWRA-ID': powra.id
        }
      });
    } catch (error: any) {
      console.error("Database operation failed:", error);
      console.error("Error details:", {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      // Handle specific error types
      if (error instanceof Prisma.PrismaClientInitializationError) {
        return NextResponse.json({ 
          error: "Database connection failed",
          details: "Could not connect to the database",
          code: error.errorCode,
          retry: true
        }, { status: 503 }); // Service Unavailable
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ 
          error: "Database request failed",
          details: error.message,
          code: error.code,
          meta: error.meta
        }, { status: 400 }); // Bad Request
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ 
          error: "Invalid data format",
          details: error.message
        }, { status: 422 }); // Unprocessable Entity
      }

      // Generic database error
      return NextResponse.json({ 
        error: "Database operation failed",
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Unhandled error in POST /api/powra:", error);
    console.error("Error stack trace:", error.stack);
    
    return NextResponse.json({
      error: "Internal server error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  console.log("Starting GET request to /api/powra");
  console.log("Auth cookie present:", !!request.headers.get('cookie')?.includes('sb-'));
  
  try {
    // Authentication Check
    let user;
    try {
      console.log("Initializing Supabase server client...");
      const supabase = await createSupabaseServer();
      
      console.log("Checking authentication state...");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error("No session found");
        throw new Error("No active session");
      }
      
      if (!session.user) {
        console.error("Session exists but no user found");
        throw new Error("Invalid session state");
      }

      user = session.user;
      console.log("Authentication successful - User ID:", user.id);
    } catch (error: any) {
      console.error("Authentication failed:", error);
      console.error("Auth error stack:", error.stack);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    console.log("Fetching POWRAs for user:", user.id);
    const powras = await prisma.pOWRA.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("Found POWRAs:", powras.length);

    return NextResponse.json(powras);
  } catch (error: any) {
    console.error("Error in GET /api/powra:", error);
    console.error("Error stack:", error.stack);
    
    if (error.message.includes("Authentication failed")) {
      return NextResponse.json(
        { 
          error: "Authentication failed",
          details: error.message
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      error: "Failed to fetch POWRAs",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
