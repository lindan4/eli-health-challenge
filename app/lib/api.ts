import axios, { AxiosError } from "axios";
import { SubmissionUploadResponse, PaginatedSubmissionsResponse } from "./types";
import { BASE_URL } from "@/constants";


const API_BASE_URL = `${BASE_URL}/api`;

const client = axios.create({ baseURL: API_BASE_URL });

/**
 * Handles API errors and checks for offline status.
 * @param error The error object from Axios.
 */
const handleError = (error: AxiosError) => {
  // ✅ OFFLINE DETECTION: If there's no response object, it's a network error.
  if (!error.response) {
    console.error("Network Error:", error.message);
    throw new Error("Network error. Please check your connection and try again.");
  }

  // Pass along the specific error message from the backend's JSON response
  const serverError = (error.response.data as { error?: string })?.error;
  if (serverError) {
    console.error("Server Error:", serverError);
    throw new Error(serverError);
  }

  // Fallback for other types of errors
  console.error("API Error:", error.message);
  throw new Error("An unexpected error occurred. Please try again.");
};

export const uploadImage = async (uri: string): Promise<SubmissionUploadResponse> => {
  const formData = new FormData();
  formData.append("image", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  try {
    const { data } = await client.post("/test-strips/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    handleError(error as AxiosError);
    // This return is needed for TypeScript, but the line above will always throw.
    return Promise.reject(error);
  }
};

export const fetchSubmissions = async (page = 1, limit = 10): Promise<PaginatedSubmissionsResponse> => {
  try {
    const { data } = await client.get("/test-strips", { params: { page, limit } });
    return data;
  } catch (error) {
    handleError(error as AxiosError);
    return Promise.reject(error);
  }
};

export default client;