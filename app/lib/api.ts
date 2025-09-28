// lib/api.ts
import axios from "axios";


const BASE_URL = "http://localhost:3000"; // Use LAN IP on device

const client = axios.create({ baseURL: BASE_URL });

export const uploadImage = async (uri: string) => {
  const formData = new FormData();
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

export const fetchSubmissions = async (page = 1, limit = 10) => {
  const { data } = await client.get("/test-strips", { params: { page, limit } });
  return data.submissions;
};

export default client;