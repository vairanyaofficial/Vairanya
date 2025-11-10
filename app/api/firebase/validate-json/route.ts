// app/api/firebase/validate-json/route.ts
// Helper endpoint to validate FIREBASE_SERVICE_ACCOUNT_JSON format
// This helps debug JSON parsing issues

import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Check both variables (priority: B64 > regular)
  const svcJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const activeVar = svcJsonB64 ? "FIREBASE_SERVICE_ACCOUNT_JSON_B64" : "FIREBASE_SERVICE_ACCOUNT_JSON";
  const activeValue = svcJsonB64 || svcJson;
  
  const validation: any = {
    timestamp: new Date().toISOString(),
    variableName: activeVar,
    hasJsonB64: !!svcJsonB64,
    hasJson: !!svcJson,
    hasAnyJson: !!activeValue,
    jsonLength: activeValue?.length || 0,
    firstChars: activeValue ? JSON.stringify(activeValue.substring(0, 50)) : null,
    lastChars: activeValue ? JSON.stringify(activeValue.substring(Math.max(0, activeValue.length - 50))) : null,
    attempts: [],
    valid: false,
    parsed: null,
    error: null,
  };

  if (!activeValue || !activeValue.trim()) {
    validation.error = "Neither FIREBASE_SERVICE_ACCOUNT_JSON_B64 nor FIREBASE_SERVICE_ACCOUNT_JSON is set";
    return NextResponse.json({
      success: false,
      validation,
      message: "Firebase service account environment variable is not set. Use FIREBASE_SERVICE_ACCOUNT_JSON_B64 (recommended) or FIREBASE_SERVICE_ACCOUNT_JSON",
    }, { status: 400 });
  }

  try {
    let cleanedJson = activeValue.trim();
    
    // Remove BOM if present
    if (cleanedJson.charCodeAt(0) === 0xFEFF) {
      cleanedJson = cleanedJson.slice(1);
      validation.attempts.push({ step: "Remove BOM", result: "Removed" });
    }
    
    // Try multiple parsing approaches
    const parseAttempts = [
      { name: "Original", value: cleanedJson },
    ];
    
    // Remove outer quotes
    if (cleanedJson.startsWith('"') && cleanedJson.endsWith('"') && cleanedJson.length > 2) {
      parseAttempts.push({
        name: "Remove outer double quotes",
        value: cleanedJson.slice(1, -1),
      });
    }
    
    if (cleanedJson.startsWith("'") && cleanedJson.endsWith("'") && cleanedJson.length > 2) {
      parseAttempts.push({
        name: "Remove outer single quotes",
        value: cleanedJson.slice(1, -1),
      });
    }
    
    // Try nested quotes
    if (cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) {
      const inner = cleanedJson.slice(1, -1);
      if (inner.startsWith('{') || inner.startsWith('[')) {
        parseAttempts.push({
          name: "Remove nested double quotes",
          value: inner,
        });
      }
    }
    
    if (cleanedJson.startsWith("'") && cleanedJson.endsWith("'")) {
      const inner = cleanedJson.slice(1, -1);
      if (inner.startsWith('"') && inner.endsWith('"')) {
        parseAttempts.push({
          name: "Remove nested single and double quotes",
          value: inner.slice(1, -1),
        });
      } else if (inner.startsWith('{') || inner.startsWith('[')) {
        parseAttempts.push({
          name: "Remove nested single quotes",
          value: inner,
        });
      }
    }
    
    // Try each parsing attempt
    for (const attempt of parseAttempts) {
      try {
        if (!attempt.value.startsWith('{') && !attempt.value.startsWith('[')) {
          validation.attempts.push({
            name: attempt.name,
            success: false,
            error: "Does not start with { or [",
            firstChars: JSON.stringify(attempt.value.substring(0, 10)),
          });
          continue;
        }
        
        const parsed = JSON.parse(attempt.value);
        
        // Validate service account structure
        if (parsed.type === 'service_account' && 
            parsed.project_id && 
            parsed.private_key && 
            parsed.client_email) {
          validation.valid = true;
          validation.parsed = {
            type: parsed.type,
            project_id: parsed.project_id,
            client_email: parsed.client_email,
            hasPrivateKey: !!parsed.private_key,
          };
          validation.attempts.push({
            name: attempt.name,
            success: true,
            message: "Valid service account JSON",
          });
          break;
        } else {
          validation.attempts.push({
            name: attempt.name,
            success: false,
            error: "Invalid service account structure",
            missingFields: {
              type: !parsed.type,
              project_id: !parsed.project_id,
              private_key: !parsed.private_key,
              client_email: !parsed.client_email,
            },
          });
        }
      } catch (parseErr: any) {
        validation.attempts.push({
          name: attempt.name,
          success: false,
          error: parseErr?.message || "Parse error",
          firstChars: JSON.stringify(attempt.value.substring(0, 20)),
        });
      }
    }
    
    if (!validation.valid) {
      validation.error = "All parsing attempts failed";
      return NextResponse.json({
        success: false,
        validation,
        message: "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or missing required fields",
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      validation,
      message: "FIREBASE_SERVICE_ACCOUNT_JSON is valid",
    });
    
  } catch (error: any) {
    validation.error = error?.message || "Unknown error";
    return NextResponse.json({
      success: false,
      validation,
      message: "Error validating JSON",
      error: error?.message,
    }, { status: 500 });
  }
}

