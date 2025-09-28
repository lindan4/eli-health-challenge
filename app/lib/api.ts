
import axios from "axios";
import { SubmissionUploadResponse, PaginatedSubmissionsResponse } from "./types";

const BASE_URL = "http://192.168.2.29:5001";

const client = axios.create({ baseURL: BASE_URL });


export const uploadImage = async (uri: string): Promise<SubmissionUploadResponse> => {
  const formData = new FormData();
  // The `as any` is often a necessary evil in React Native's FormData implementation.
  // This is one of the few acceptable places for it.
  formData.append("image", {
    uri,
    name: "photo.jpg",
    type: "image/jpeg",
  } as any);

  const { data } = await client.post("/test-strips/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

export const fetchSubmissions = async (page = 1, limit = 10): Promise<PaginatedSubmissionsResponse> => {
  const { data } = await client.get("/test-strips", { params: { page, limit } });
  return data; // Return the full response object with pagination data
};

export default client;