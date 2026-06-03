// S3UploadService.js
// One service handles all file uploads across all features

import { ipUrl } from '../Auth/BaseUrl';

// ─────────────────────────────────────────────
// STEP 1: Get presigned upload URL from server
// API: GET /api/physiotherapy-doctor/s3/upload-url
//      ?fieldName=prescriptionPdf&extension=pdf&fileSize=2048000
// Returns: { uploadUrl, fileKey, contentType }
// ─────────────────────────────────────────────
async function getUploadUrl(fieldName, extension, fileSize) {
    const url = `${ipUrl}/api/physiotherapy-doctor/s3/upload-url`
        + `?fieldName=${encodeURIComponent(fieldName)}`
        + `&extension=${encodeURIComponent(extension)}`
        + `&fileSize=${fileSize}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to get upload URL');
    }

    return data; // { uploadUrl, fileKey, contentType }
}

// ─────────────────────────────────────────────
// STEP 2: Upload file directly to S3
// PUT to presigned uploadUrl with raw file binary
// ─────────────────────────────────────────────
async function uploadToS3(uploadUrl, file, contentType) {
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType, // must use exact contentType from Step 1
        },
        body: file, // raw file — no base64
    });

    if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }
}

// ─────────────────────────────────────────────
// STEP 3: Validate upload after S3 upload
// API: GET /api/physiotherapy-doctor/s3/validate-upload
//      ?fileKey=<key>&fieldName=prescriptionPdf
// Returns: { valid, uploadedType, uploadedMime, uploadedSize }
// ─────────────────────────────────────────────
async function validateUpload(fileKey, fieldName) {
    const url = `${ipUrl}/api/physiotherapy-doctor/s3/validate-upload`
        + `?fileKey=${encodeURIComponent(fileKey)}`
        + `&fieldName=${encodeURIComponent(fieldName)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'File validation failed');
    }

    if (!data.valid) {
        throw new Error(`Upload validation failed: file not found or invalid type`);
    }

    return data; // { valid, uploadedType, uploadedMime, uploadedSize }
}

// ─────────────────────────────────────────────
// MAIN FUNCTION: Generic upload — call from any component
// Usage: const fileKey = await uploadFile('prescriptionPdf', file)
// ─────────────────────────────────────────────
export async function uploadFile(fieldName, file) {
    // Get extension from file name
    const extension = file.name.split('.').pop().toLowerCase();

    // Step 1 — Get presigned URL
    const { uploadUrl, fileKey, contentType } =
        await getUploadUrl(fieldName, extension, file.size);

    // Step 2 — Upload directly to S3
    await uploadToS3(uploadUrl, file, contentType);

    // Step 3 — Validate upload
    await validateUpload(fileKey, fieldName);

    // Return fileKey to store in your API payload
    return fileKey;
}

// ─────────────────────────────────────────────
// CONVENIENCE: Upload prescription PDF
// fieldName = 'prescriptionPdf', extension forced to 'pdf'
// Validates file is a PDF before uploading
// Usage: const fileKey = await uploadPrescriptionPdf(file)
// ─────────────────────────────────────────────
export async function uploadPrescriptionPdf(file) {
    // Guard: only allow PDF files
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf') {
        throw new Error('Only PDF files are allowed for prescriptions');
    }

    // Step 1 — Get presigned URL with fieldName=prescriptionPdf
    const { uploadUrl, fileKey, contentType } =
        await getUploadUrl('prescriptionPdf', 'pdf', file.size);

    // Step 2 — Upload to S3
    await uploadToS3(uploadUrl, file, contentType);

    // Step 3 — Validate the uploaded PDF
    const validation = await validateUpload(fileKey, 'prescriptionPdf');

    // Return fileKey for use in prescription save API
    return fileKey;
}