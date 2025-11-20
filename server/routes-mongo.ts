import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authMongo from "./api/authMongo";
import dashboardMongo from "./api/dashboardMongo";
import attendanceMongo from "./api/attendanceMongo";
import leaveMongo from "./api/leaveMongo";
import notificationsMongo from "./api/notificationsMongo";
import profileMongo from "./api/profileMongo";
import employeeMongo from "./api/employeeMongo";
import orgMongo from "./api/orgMongo";
import messagesMongo from "./api/messagesMongo";
import settingsRoutes from "./api/settings";
import cronRoutes from "./api/cron";
import { verifyToken } from "./middleware/auth";
import publicOrg from "./api/publicOrg";

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
