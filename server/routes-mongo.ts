import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authMongo from "./api/authMongo.js";
import dashboardMongo from "./api/dashboardMongo.js";
import attendanceMongo from "./api/attendanceMongo.js";
import leaveMongo from "./api/leaveMongo.js";
import notificationsMongo from "./api/notificationsMongo.js";
import profileMongo from "./api/profileMongo.js";
import employeeMongo from "./api/employeeMongo.js";
import orgMongo from "./api/orgMongo.js";
import messagesMongo from "./api/messagesMongo.js";
import settingsRoutes from "./api/settings.js";
import cronRoutes from "./api/cron.js";
import { verifyToken } from "./middleware/auth.js";
import publicOrg from "./api/publicOrg.js";

export async function registerMongoRoutes(app: Express): Promise<Server> {
  // Cookie parser middleware
  app.use(cookieParser());

  // Mount auth routes (public)
  app.use("/api/auth", authMongo);

  // Mount settings routes (public GET, protected PUT)
  app.use("/api/settings", settingsRoutes);

  // Mount public org routes
  app.use("/api/public/org", publicOrg);

  // Mount cron routes (public/protected by secret)
  app.use("/api/cron", cronRoutes);

  // Mount protected API routes (require JWT authentication)
  app.use("/api/dashboard", verifyToken, dashboardMongo);
  app.use("/api/attendance", verifyToken, attendanceMongo);
  app.use("/api/leave", verifyToken, leaveMongo);
  app.use("/api/notifications", verifyToken, notificationsMongo);
  app.use("/api/profile", verifyToken, profileMongo);
  app.use("/api/employees", verifyToken, employeeMongo);
  app.use("/api/org", verifyToken, orgMongo);
  app.use("/api/messages", verifyToken, messagesMongo);

  const httpServer = createServer(app);

  return httpServer;
}
