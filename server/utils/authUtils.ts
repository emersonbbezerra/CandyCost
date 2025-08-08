
import bcrypt from "bcryptjs";
import { prisma } from "../db";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  return user;
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  return user;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
