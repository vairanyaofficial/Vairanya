import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth-server";
import ImageKit from "imagekit";

/**
 * ImageKit.io Upload API Endpoint
 * Securely handles image uploads to ImageKit.io CDN
 * 
 * Required Environment Variables:
 * - IMAGEKIT_PRIVATE_KEY: Your ImageKit private key (server-side only)
 * - NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: Your ImageKit public key
 * - NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: Your ImageKit URL endpoint
 */

export async function POST(request: NextRequest) {
  console.log("ImageKit upload request received");
  
  try {
    // Require admin authentication for uploads
    const auth = requireAdmin(request);
    if (!auth.authenticated) {
      console.error("ImageKit upload: Unauthorized request");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("ImageKit upload: Admin authenticated");
  } catch (authError: any) {
    console.error("ImageKit upload: Authentication error:", {
      error: authError?.message,
      stack: authError?.stack?.substring(0, 500),
    });
    return NextResponse.json(
      { 
        success: false, 
        error: `Authentication failed: ${authError?.message || 'Unknown error'}` 
      },
      { status: 401 }
    );
  }

  try {
    // Use environment variables or fallback to provided credentials
    // Note: Private key should NEVER be hardcoded - use environment variables only
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_cmF40H1yISoHKloI9dpdAOJJXdc=";
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/zjax0fbrm";

    // Detailed credential check
    if (!privateKey) {
      console.error("IMAGEKIT_PRIVATE_KEY is missing");
      return NextResponse.json(
        {
          success: false,
          error: "IMAGEKIT_PRIVATE_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!publicKey) {
      console.error("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is missing");
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    if (!urlEndpoint) {
      console.error("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is missing");
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    console.log("ImageKit credentials found:", {
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
      privateKeyPrefix: privateKey?.substring(0, 10) || "none",
      hasPublicKey: !!publicKey,
      publicKeyLength: publicKey?.length || 0,
      publicKeyPrefix: publicKey?.substring(0, 10) || "none",
      urlEndpoint: urlEndpoint,
      urlEndpointValid: urlEndpoint?.startsWith("https://") || false,
    });

    // Validate and clean URL endpoint format
    // Remove trailing slash if present (ImageKit SDK might not like it)
    const cleanedUrlEndpoint = urlEndpoint.replace(/\/+$/, '');
    
    if (!cleanedUrlEndpoint.startsWith("https://")) {
      console.error("Invalid URL endpoint format:", urlEndpoint);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL endpoint format. It should start with 'https://' (e.g., https://ik.imagekit.io/your_id)",
        },
        { status: 500 }
      );
    }
    
    console.log("ImageKit URL endpoint:", {
      original: urlEndpoint,
      cleaned: cleanedUrlEndpoint,
    });

    // Validate credentials format (basic checks)
    if (privateKey.length < 10) {
      console.error("Private key seems too short:", privateKey.length);
      return NextResponse.json(
        {
          success: false,
          error: "Private key appears to be invalid (too short). Please check your ImageKit credentials.",
        },
        { status: 500 }
      );
    }

    if (publicKey.length < 10) {
      console.error("Public key seems too short:", publicKey.length);
      return NextResponse.json(
        {
          success: false,
          error: "Public key appears to be invalid (too short). Please check your ImageKit credentials.",
        },
        { status: 500 }
      );
    }

    console.log("ImageKit upload: Parsing form data");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string | null;
    // Default to root (empty/null) - folder parameter is optional
    const folder = (formData.get("folder") as string | null) || null;

    console.log("ImageKit upload: Form data parsed", {
      hasFile: !!file,
      fileName: fileName,
      folder: folder || "(root - no folder)",
      fileType: file?.type,
      fileSize: file?.size,
    });

    if (!file) {
      console.error("ImageKit upload: No file provided in request");
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.error("ImageKit upload: Invalid file type", {
        fileType: file.type,
        allowedTypes: allowedTypes,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("ImageKit upload: File size exceeds limit", {
        fileSize: file.size,
        maxSize: maxSize,
      });
      return NextResponse.json(
        { success: false, error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit` },
        { status: 400 }
      );
    }

    console.log("ImageKit upload: File validation passed", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    // Initialize ImageKit SDK - matching the format from ImageKit documentation
    let imagekit;
    try {
      // Validate credentials before initialization
      if (!publicKey || !privateKey || !cleanedUrlEndpoint) {
        throw new Error("Missing required ImageKit credentials");
      }
      
      // Initialize ImageKit SDK exactly as shown in documentation
      imagekit = new ImageKit({
        publicKey: publicKey.trim(),
        privateKey: privateKey.trim(),
        urlEndpoint: cleanedUrlEndpoint.trim(),
      });
      
      // Verify initialization was successful
      if (!imagekit) {
        throw new Error("ImageKit initialization returned undefined");
      }
      
      console.log("ImageKit SDK initialized successfully:", {
        urlEndpoint: cleanedUrlEndpoint,
        publicKeyPrefix: publicKey.substring(0, 15) + "...",
        hasPrivateKey: !!privateKey,
      });
    } catch (initError: any) {
      console.error("Failed to initialize ImageKit SDK:", {
        error: initError?.message,
        stack: initError?.stack?.substring(0, 500),
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
        hasUrlEndpoint: !!cleanedUrlEndpoint,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to initialize ImageKit: ${initError?.message || 'Unknown error'}. Please check your ImageKit credentials.`,
        },
        { status: 500 }
      );
    }

    // Convert file to buffer
    let fileBuffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      
      // Validate buffer
      if (!fileBuffer || fileBuffer.length === 0) {
        console.error("File buffer is empty or invalid");
        return NextResponse.json(
          { success: false, error: "File buffer is empty or invalid" },
          { status: 400 }
        );
      }
      
      if (fileBuffer.length !== file.size) {
        console.warn("Buffer size mismatch:", {
          bufferSize: fileBuffer.length,
          fileSize: file.size,
        });
        // This is usually not a problem, but log it for debugging
      }
      
      console.log("File converted to buffer:", {
        size: fileBuffer.length,
        originalSize: file.size,
        type: file.type,
        bufferValid: fileBuffer.length > 0,
        bufferType: fileBuffer.constructor.name,
        isBuffer: Buffer.isBuffer(fileBuffer),
      });
    } catch (bufferError: any) {
      console.error("Error converting file to buffer:", {
        error: bufferError?.message,
        stack: bufferError?.stack?.substring(0, 500),
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to process file: ${bufferError?.message || 'Unknown error'}`,
        },
        { status: 400 }
      );
    }

    // Prepare file name - ImageKit has restrictions on file names
    // Use a simpler format to avoid issues
    const timestamp = Date.now();
    let baseFileName = fileName || file.name;
    
    // Remove existing extension to avoid double extensions
    const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, "");
    
    // Get file extension from MIME type first (more reliable), then fallback to filename
    let fileExtension = 'jpg';
    if (file.type) {
      const mimeToExt: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      fileExtension = mimeToExt[file.type.toLowerCase()] || 'jpg';
    }
    
    // Fallback to extension from filename if MIME type didn't give us one
    if (fileExtension === 'jpg') {
      const extFromName = baseFileName.split('.').pop()?.toLowerCase();
      if (extFromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extFromName)) {
        fileExtension = extFromName === 'jpeg' ? 'jpg' : extFromName;
      }
    }
    
    // Generate a simple, unique file name: timestamp_random.ext
    // Keep it very short to avoid any issues
    const hash = Math.random().toString(36).substring(2, 10);
    const shortFileName = `${timestamp}_${hash}.${fileExtension}`;
    
    // Validate folder path - if folder is provided, clean it; otherwise upload to root
    let cleanFolder: string | null = null;
    if (folder && folder.trim() !== '' && folder.trim() !== '/') {
      cleanFolder = folder.replace(/\/+$/, '').replace(/^\/+/, ''); // Remove trailing and leading slashes
      // If folder becomes empty after cleaning, set to null (root)
      if (cleanFolder === '' || cleanFolder === '/') {
        cleanFolder = null;
      }
    }
    
    console.log("Uploading file to ImageKit:", {
      fileName: shortFileName,
      fileNameLength: shortFileName.length,
      folder: cleanFolder || "(root)",
      folderLength: cleanFolder?.length || 0,
      totalPathLength: cleanFolder ? (cleanFolder + '/' + shortFileName).length : shortFileName.length,
      size: fileBuffer.length,
      mimeType: file.type,
    });

    // Validate file buffer - check magic bytes to ensure it's a valid image
    const magicBytes = fileBuffer.subarray(0, 8);
    const isValidImage = 
      // JPEG: FF D8 FF
      (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) ||
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) ||
      // GIF: 47 49 46 38
      (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x38) ||
      // WEBP: RIFF...WEBP
      (magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46 && 
       magicBytes[8] === 0x57 && magicBytes[9] === 0x45 && magicBytes[10] === 0x42 && magicBytes[11] === 0x50);
    
    if (!isValidImage) {
      const hexBytes = Array.from(magicBytes).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      console.error("File does not appear to be a valid image file:", {
        magicBytes: hexBytes,
        expectedType: file.type,
        fileName: file.name,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `File does not appear to be a valid image. File type: ${file.type}, Magic bytes: ${hexBytes}` 
        },
        { status: 400 }
      );
    }
    
    console.log("File validation passed:", {
      magicBytes: Array.from(magicBytes.subarray(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
      fileType: file.type,
      fileSize: fileBuffer.length,
    });

    // Upload to ImageKit
    // ImageKit SDK returns IKResponse<UploadResponse> which is UploadResponse & { $ResponseMetadata }
    // Declare variables that might be needed in error handler
    let uploadData;
    const uploadFileName = shortFileName;
    const uploadFolder = cleanFolder || '(root)';
    const uploadBaseFileName = baseFileName;
    
    try {
      // Prepare upload options - Simple format matching ImageKit SDK documentation
      // Format: imagekit.upload({ file: buffer, fileName: "name.jpg" })
      const uploadOptions: any = {
        file: fileBuffer, // Buffer containing the image file
        fileName: shortFileName, // Unique file name
      };
      
      // Only add folder if specified (optional parameter)
      if (cleanFolder && cleanFolder.trim() !== '' && cleanFolder !== '/') {
        uploadOptions.folder = cleanFolder;
        console.log("Uploading to folder:", cleanFolder);
      } else {
        console.log("Uploading to root folder");
      }
      
      console.log("Calling ImageKit.upload() with options:", {
        fileName: shortFileName,
        folder: cleanFolder || '(root)',
        fileSize: fileBuffer.length,
        fileSizeMB: (fileBuffer.length / 1024 / 1024).toFixed(2),
        fileType: file.type,
      });
      
      // Upload to ImageKit using the SDK
      // This matches the format: imagekit.upload({ file: buffer, fileName: "name.jpg" })
      const uploadResponse = await imagekit.upload(uploadOptions);
      
      // Handle response - ImageKit SDK returns the upload response directly
      uploadData = uploadResponse;
      
      console.log("ImageKit upload response:", {
        hasUrl: !!uploadData?.url,
        hasFileId: !!uploadData?.fileId,
        url: uploadData?.url ? uploadData.url.substring(0, 80) + "..." : "none",
        fileId: uploadData?.fileId || "none",
      });
      
      // Validate response
      if (!uploadData) {
        throw new Error("ImageKit upload returned empty response");
      }
      
      if (!uploadData.url) {
        console.error("ImageKit response missing URL:", JSON.stringify(uploadData, null, 2));
        throw new Error("ImageKit upload succeeded but no URL in response");
      }
      
      console.log("ImageKit upload successful!");
    } catch (uploadError: any) {
      // Log the complete error object for debugging
      try {
        // Try to serialize error, but handle cases where it might fail
        const errorString = JSON.stringify(uploadError, (key, value) => {
          if (key === 'stack') return value?.substring(0, 500);
          if (value instanceof Error) {
            return {
              name: value.name,
              message: value.message,
              stack: value.stack?.substring(0, 500)
            };
          }
          return value;
        }, 2);
        console.error("ImageKit upload failed - Full error object:", errorString);
      } catch (serializeError) {
        // If JSON.stringify fails, log error properties manually
        console.error("ImageKit upload failed - Error (could not serialize):", {
          message: uploadError?.message,
          name: uploadError?.name,
          code: uploadError?.code,
          type: typeof uploadError,
          constructor: uploadError?.constructor?.name,
        });
      }
      console.error("ImageKit upload failed - Error type:", typeof uploadError);
      console.error("ImageKit upload failed - Error constructor:", uploadError?.constructor?.name);
      
      // Try to extract error details from various possible structures
      // ImageKit SDK might return a plain object instead of an Error instance
      let errorDetails: any = {
        message: uploadError?.message,
        name: uploadError?.name,
        code: uploadError?.code,
        stack: uploadError?.stack?.substring(0, 500), // First 500 chars of stack
      };
      
      // Check if error is a plain object (not an Error instance)
      if (uploadError && typeof uploadError === 'object' && !(uploadError instanceof Error)) {
        // Extract all properties from plain object
        errorDetails.plainObject = uploadError;
        errorDetails.help = uploadError.help;
        errorDetails.message = uploadError.message || uploadError.help || uploadError.error;
        errorDetails.reason = uploadError.reason;
        errorDetails.details = uploadError.details;
      }

      // Check for Axios-like error structure or HTTP error response
      if (uploadError?.response) {
        errorDetails.response = {
          status: uploadError.response.status,
          statusCode: uploadError.response.statusCode,
          statusText: uploadError.response.statusText,
          data: uploadError.response.data,
          body: uploadError.response.body,
          headers: uploadError.response.headers,
        };
        
        // Try to parse response data if it's a string
        if (typeof uploadError.response.data === 'string') {
          try {
            errorDetails.response.parsedData = JSON.parse(uploadError.response.data);
          } catch (e) {
            errorDetails.response.rawData = uploadError.response.data;
          }
        }
        
        // Log 400/500 errors specifically with full details
        if (uploadError.response.status === 400 || uploadError.response.statusCode === 400 ||
            uploadError.response.status === 500 || uploadError.response.statusCode === 500) {
          console.error(`ImageKit returned ${uploadError.response.status || uploadError.response.statusCode} error:`, {
            status: uploadError.response.status,
            statusCode: uploadError.response.statusCode,
            statusText: uploadError.response.statusText,
            data: uploadError.response.data,
            body: uploadError.response.body,
            headers: JSON.stringify(uploadError.response.headers || {}),
            fullResponse: JSON.stringify(uploadError.response, null, 2),
          });
        }
      }
      
      // Also check for status/statusCode directly on error (some SDKs put it there)
      if (uploadError?.status === 400 || uploadError?.statusCode === 400 ||
          uploadError?.status === 500 || uploadError?.statusCode === 500) {
        console.error(`ImageKit ${uploadError?.status || uploadError?.statusCode} error detected on error object:`, {
          status: uploadError.status,
          statusCode: uploadError.statusCode,
          error: uploadError,
        });
      }

      // Check for ImageKit-specific error structure
      if (uploadError?.body) {
        errorDetails.body = uploadError.body;
      }

      // Check for HTTP error structure
      if (uploadError?.status) {
        errorDetails.httpStatus = uploadError.status;
      }
      if (uploadError?.statusCode) {
        errorDetails.httpStatusCode = uploadError.statusCode;
      }

      console.error("ImageKit upload error details:", errorDetails);
      
      // Extract error message from various possible locations
      // Check if it's a plain object first (ImageKit SDK sometimes returns plain objects)
      let errorMessage: string;
      if (uploadError && typeof uploadError === 'object' && !(uploadError instanceof Error)) {
        // Plain object error (like { help: "Internal Server Error" })
        errorMessage = uploadError.help || 
          uploadError.message || 
          uploadError.error || 
          uploadError.reason ||
          (uploadError.details ? JSON.stringify(uploadError.details) : null) ||
          JSON.stringify(uploadError);
      } else {
        // Standard Error object
        errorMessage = 
          uploadError?.response?.data?.message ||
          uploadError?.response?.data?.error ||
          uploadError?.response?.data?.help ||
          uploadError?.response?.body?.message ||
          uploadError?.response?.body?.error ||
          uploadError?.response?.body?.help ||
          (typeof uploadError?.response?.data === 'string' ? uploadError.response.data : null) ||
          uploadError?.body?.message ||
          uploadError?.body?.error ||
          uploadError?.body?.help ||
          uploadError?.message ||
          uploadError?.toString() ||
          "Unknown error occurred during ImageKit upload";
      }

      const errorMessageLower = errorMessage.toLowerCase();
      
      // Check for 400/500 errors specifically
      const is400Error = uploadError?.response?.status === 400 || 
                        uploadError?.response?.statusCode === 400 ||
                        uploadError?.status === 400 ||
                        uploadError?.statusCode === 400;
      
      const is500Error = uploadError?.response?.status === 500 || 
                        uploadError?.response?.statusCode === 500 ||
                        uploadError?.status === 500 ||
                        uploadError?.statusCode === 500;
      
      // Handle 500 Internal Server Error from ImageKit
      if (is500Error || errorMessageLower.includes("internal server error")) {
        const internalServerErrorMsg = `
ImageKit returned a 500 Internal Server Error. This usually indicates:
1. Image resolution is too high (ImageKit free plan has 25 megapixel limit)
2. File format issue or corrupted file data
3. ImageKit service is temporarily unavailable
4. Account limits or restrictions

Upload details:
- File name: ${uploadFileName || 'N/A'}
- File size: ${fileBuffer?.length || 0} bytes (${((fileBuffer?.length || 0) / 1024 / 1024).toFixed(2)} MB)
- File type: ${file?.type || 'N/A'}
- Folder: ${uploadFolder === '(root)' ? 'root' : uploadFolder}

Troubleshooting steps:
1. Check if image resolution exceeds 25 megapixels (width × height)
2. Try a smaller test image first
3. Verify ImageKit account status: https://imagekit.io/dashboard
4. Check ImageKit status page: https://status.imagekit.io/
5. Contact ImageKit support if issue persists

ImageKit error: ${errorMessage}
Full error response: ${JSON.stringify(uploadError?.response?.data || uploadError?.body || uploadError, null, 2)}
        `.trim();
        
        console.error("ImageKit 500 Internal Server Error:", internalServerErrorMsg);
        throw new Error(internalServerErrorMsg);
      }
      
      if (is400Error) {
        // Extract detailed error message from ImageKit's 400 response
        const badRequestMessage = 
          uploadError?.response?.data?.message ||
          uploadError?.response?.data?.error ||
          uploadError?.response?.data?.help ||
          uploadError?.response?.body?.message ||
          uploadError?.response?.body?.error ||
          uploadError?.body?.message ||
          uploadError?.body?.error ||
          errorMessage;
        
        const badRequestDetails = `
ImageKit returned a 400 Bad Request error. Common causes:
1. File name contains invalid characters or is too long
2. File format is not supported or file is corrupted
3. Folder path is invalid or contains invalid characters
4. File size exceeds ImageKit's limits (even if under 10MB)
5. Missing required parameters in upload request

Upload attempt details:
- File name: ${uploadFileName || 'N/A'} (${uploadFileName?.length || 0} chars)
- Folder: ${uploadFolder === '(root)' ? 'root (no folder)' : uploadFolder || 'N/A'} ${uploadFolder !== '(root)' ? `(${uploadFolder?.length || 0} chars)` : ''}
- File size: ${fileBuffer?.length || 0} bytes (${((fileBuffer?.length || 0) / 1024 / 1024).toFixed(2)} MB)
- File type: ${file?.type || 'N/A'}
- Original file name: ${uploadBaseFileName || 'N/A'}

ImageKit error message: ${badRequestMessage}

Suggestions:
- Try uploading with a simpler file name (just alphanumeric characters)
- Try uploading to root folder (remove folder parameter)
- Verify the file is a valid image file
- Check ImageKit dashboard for account limits
        `.trim();
        
        console.error("ImageKit 400 Bad Request Error:", badRequestDetails);
        console.error("Full error response:", JSON.stringify(uploadError?.response?.data || uploadError?.body || uploadError, null, 2));
        throw new Error(badRequestDetails);
      }
      
      // Check if it's an "Internal Server Error" from ImageKit
      if (errorMessageLower.includes("internal server error") || uploadError?.help === "Internal Server Error") {
        const internalErrorMsg = `
ImageKit returned an Internal Server Error. This usually indicates:
1. File name is too long or contains invalid characters (max 255 chars for full path)
2. File data might be corrupted or in an unsupported format
3. Folder path is invalid or too long
4. ImageKit service is experiencing issues

Current upload details:
- File name: ${uploadFileName} (${uploadFileName?.length || 0} chars)
- Folder: ${uploadFolder === '(root)' ? 'root (no folder)' : uploadFolder} ${uploadFolder !== '(root)' ? `(${uploadFolder?.length || 0} chars)` : ''}
- Total path length: ${uploadFolder && uploadFileName && uploadFolder !== '(root)' ? (uploadFolder + '/' + uploadFileName).length : uploadFileName?.length || 'N/A'} chars
- File size: ${fileBuffer.length} bytes
- File type: ${file.type}
- Original file name: ${uploadBaseFileName || 'N/A'}

Suggestions:
- Try shortening the file name
- Try uploading to root folder first (remove folder parameter)
- Check if the file is valid and not corrupted
- Verify ImageKit service status: https://status.imagekit.io/

Original error: ${errorMessage}
        `.trim();
        
        console.error("ImageKit Internal Server Error:", internalErrorMsg);
        throw new Error(internalErrorMsg);
      }
      
      // Check for authentication errors specifically
      const isAuthError = 
        errorMessageLower.includes("authenticated") ||
        errorMessageLower.includes("authentication") ||
        errorMessageLower.includes("unauthorized") ||
        errorMessageLower.includes("401") ||
        errorMessageLower.includes("403") ||
        (errorMessageLower.includes("invalid") && errorMessageLower.includes("key")) ||
        errorMessageLower.includes("credential") ||
        errorMessageLower.includes("access denied");
      
      if (isAuthError || uploadError?.response?.status === 401 || uploadError?.response?.status === 403) {
        const detailedError = `
ImageKit authentication failed. This usually means:
1. Your Private Key is incorrect - Check ImageKit Dashboard → Developer Options
2. Your Public Key is incorrect - Check ImageKit Dashboard → Developer Options  
3. Your URL Endpoint is incorrect - Should be: https://ik.imagekit.io/your_imagekit_id
4. Your ImageKit account may be suspended or inactive

Please verify:
- Private Key starts with correct format (from ImageKit dashboard)
- Public Key starts with correct format (from ImageKit dashboard)
- URL Endpoint matches your ImageKit account exactly
- All credentials are copied correctly (no extra spaces)

Original Error: ${errorMessage}
HTTP Status: ${uploadError?.response?.status || uploadError?.status || 'N/A'}
        `.trim();
        
        console.error("Authentication error details:", detailedError);
        throw new Error(detailedError);
      }
      
      // Check for network errors
      const isNetworkError = 
        errorMessageLower.includes("network") ||
        errorMessageLower.includes("connection") ||
        errorMessageLower.includes("timeout") ||
        errorMessageLower.includes("econnrefused") ||
        errorMessageLower.includes("enotfound");
      
      if (isNetworkError) {
        throw new Error(`Network error while uploading to ImageKit: ${errorMessage}. Please check your internet connection and ImageKit service status.`);
      }
      
      // Return a more detailed error message
      const detailedErrorMessage = `Failed to upload file to ImageKit: ${errorMessage}${uploadError?.response?.status ? ` (HTTP ${uploadError.response.status})` : ''}`;
      throw new Error(detailedErrorMessage);
    }

    return NextResponse.json(
      {
        success: true,
        url: uploadData.url,
        fileId: uploadData.fileId,
        thumbnailUrl: uploadData.thumbnailUrl || uploadData.url,
        name: uploadData.name,
        width: uploadData.width,
        height: uploadData.height,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log the error with full details for debugging
    console.error("ImageKit upload error (outer catch):", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack?.substring(0, 1000),
      type: typeof error,
      constructor: error?.constructor?.name,
    });
    
    // Try to extract comprehensive error details
    const errorDetails: any = {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    };
    
    // Check for response data (Axios-like error structure)
    if (error?.response) {
      errorDetails.response = {
        status: error.response.status,
        statusCode: error.response.statusCode,
        statusText: error.response.statusText,
        data: error.response.data,
        body: error.response.body,
      };
      
      // Try to parse response data if it's a string
      if (typeof error.response.data === 'string') {
        try {
          errorDetails.response.parsedData = JSON.parse(error.response.data);
        } catch (e) {
          errorDetails.response.rawData = error.response.data.substring(0, 500);
        }
      }
    }
    
    // Check for HTTP status directly on error
    if (error?.status) {
      errorDetails.httpStatus = error.status;
    }
    if (error?.statusCode) {
      errorDetails.httpStatusCode = error.statusCode;
    }
    
    // Log full error details
    console.error("Full error details (outer catch):", JSON.stringify(errorDetails, null, 2));
    
    // Extract error message - check multiple possible locations
    let errorMessage = error?.message;
    
    // Check response data first (most specific)
    if (!errorMessage && error?.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response.data.help) {
        errorMessage = error.response.data.help;
      }
    }
    
    // Check response body
    if (!errorMessage && error?.response?.body) {
      if (typeof error.response.body === 'string') {
        errorMessage = error.response.body;
      } else if (error.response.body.message) {
        errorMessage = error.response.body.message;
      } else if (error.response.body.error) {
        errorMessage = error.response.body.error;
      }
    }
    
    // Check error body directly
    if (!errorMessage && error?.body) {
      if (typeof error.body === 'string') {
        errorMessage = error.body;
      } else if (error.body.message) {
        errorMessage = error.body.message;
      } else if (error.body.error) {
        errorMessage = error.body.error;
      }
    }
    
    // Fallback to generic message
    if (!errorMessage) {
      errorMessage = "Failed to upload image to ImageKit. Please check server logs for details.";
    }
    
    // Determine HTTP status code
    const httpStatus = error?.response?.status || 
      error?.response?.statusCode || 
      error?.status || 
      error?.statusCode ||
      (errorMessage.toLowerCase().includes("unauthorized") || errorMessage.toLowerCase().includes("authentication") ? 401 : 500);
    
    // Return error response with detailed information in development
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            httpStatus: httpStatus,
            ...(errorDetails.response?.data && { responseData: errorDetails.response.data }),
            ...(errorDetails.response?.parsedData && { parsedResponseData: errorDetails.response.parsedData }),
          },
        }),
      },
      { status: httpStatus }
    );
  }
}

