import type { RequestHandler } from "express";
import { isAdmin as isAdminOriginal, isAuthenticated as isAuthenticatedOriginal, userService } from "../services/userService";

export const isAuthenticated: RequestHandler = isAuthenticatedOriginal;
export const isAdmin: RequestHandler = isAdminOriginal;
export { userService };

