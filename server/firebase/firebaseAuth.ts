import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { verifyFirebaseToken, getFirebaseUser } from "./firebase-admin";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "complianceworxs-secure-session-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export async function setupFirebaseAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  app.post("/api/auth/firebase/verify", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }

      const decodedToken = await verifyFirebaseToken(idToken);
      const firebaseUser = await getFirebaseUser(decodedToken.uid);
      
      const user = await authStorage.upsertUser({
        id: decodedToken.uid,
        email: decodedToken.email || null,
        firstName: firebaseUser.displayName?.split(" ")[0] || null,
        lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || null,
        profileImageUrl: firebaseUser.photoURL || null,
      });

      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        res.json({ user, success: true });
      });
    } catch (error: any) {
      console.error("Firebase token verification failed:", error);
      res.status(401).json({ message: "Invalid or expired token" });
    }
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    const sessionUser = (req.session as any)?.user;
    
    if (!sessionUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.json(sessionUser);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  
  if (!sessionUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  (req as any).user = sessionUser;
  next();
};
