export interface Submission {
  id: string;
  imageUri?: string;          // local URI
  qrCode?: string | null;
  status?: "pending" | "success" | "error";
  thumbnailUrl?: string;
  createdAt?: string;
}