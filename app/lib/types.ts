// lib/types.ts

// The single source of truth for a submission's structure in the mobile app.
export interface Submission {
  id: string;
  qrCode: string | null;
  // This status now includes all possible states from client and server
  status: "pending" | "processed" | "expired" | "error";
  quality: "good" | "fair" | "poor" | null;
  thumbnailUrl: string | null;
  createdAt: string;

  // Client-side only properties
  localImageUri?: string; // The URI of the image stored on the device
}

// ... other types from previous suggestion remain the same
export interface SubmissionUploadResponse {
  id: string;
  status: "processed" | "expired" | "error";
  qrCode: string | null;
  qrCodeValid: boolean;
  quality: "good" | "fair" | "poor";
  processedAt: string;
  thumbnailUrl: string; // Add this
}

export interface PaginatedSubmissionsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  submissions: Submission[];
}