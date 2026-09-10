import { serverFetch } from "@/lib/api/server-client";
import { User, api } from "@/lib/api";

export async function getUsersServer(): Promise<User[]> {
  try {
    return await serverFetch<User[]>("/auth/users");
  } catch (error) {
    console.error("Failed to fetch users on server:", error);
    return [];
  }
}
