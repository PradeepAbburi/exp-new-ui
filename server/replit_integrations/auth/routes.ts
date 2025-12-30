import type { Express } from "express";
import { authStorage } from "./storage.js";
import { isAuthenticated } from "./replitAuth.js";
import { hashPassword } from "./localAuth.js";
import passport from "passport";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
});

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/password signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, username, password } = signupSchema.parse(req.body);

      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const user = await authStorage.createLocalUser(email, username, passwordHash);

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0].message });
      } else {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Signup failed" });
      }
    }
  });

  // Email/password login
  app.post(
    "/api/auth/login",
    passport.authenticate("local", { session: true }),
    (req, res) => {
      res.json(req.user);
    }
  );

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });
}
