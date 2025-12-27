import { storage as mainStorage } from "../../storage";
import { type User, type UpsertUser } from "@shared/models/auth";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createLocalUser(email: string, username: string, passwordHash: string): Promise<User>;
}

// Ensure mainStorage satisfies IAuthStorage or close enough
export const authStorage: IAuthStorage = mainStorage as unknown as IAuthStorage;
