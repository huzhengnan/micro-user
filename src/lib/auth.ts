import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type TokenPayload = {
  userId: string;
  role: string;
};

export async function verifyToken(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    
    if (!token) {
      return { success: false, message: "No token provided" };
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // 验证用户是否存在
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    return { success: true, userId: decoded.userId, role: decoded.role };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, message: "Invalid token" };
  }
}

// Alias for backward compatibility
export async function authenticateRequest(request: NextRequest) {
  const result = await verifyToken(request);
  if (result.success) {
    // Get user data for compatibility
    const user = await db.user.findUnique({
      where: { id: result.userId },
    });
    return { success: true, userId: result.userId, role: result.role, user };
  }
  return { success: false, message: result.message, user: null };
}

export function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" });
}