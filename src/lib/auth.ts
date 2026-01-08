import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'finanx-secret-key-change-in-production'
);

export interface UserPayload {
  userId: string;
  email: string;
}

export async function createToken(payload: UserPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  
  return verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  
  return user;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'finanx-salt').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
