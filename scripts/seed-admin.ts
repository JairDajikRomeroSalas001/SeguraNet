import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// Funciones de cifrado (deben coincidir con las de tu lib/crypto.ts)
function encryptAES(text: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const keyBuffer = Buffer.from(key, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME || "admin1";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMeImmediately!2026";
  const fullName = process.env.BOOTSTRAP_ADMIN_FULLNAME || "Admin User";
  const dni = process.env.BOOTSTRAP_ADMIN_DNI || "00000000";
  const pepper = process.env.ARGON2_PEPPER || "dev-pepper";
  const aesKey = process.env.AES_MASTER_KEY || "18ec04d842dfff4de1cffd1ad51c49520290a09dd6c992d94c3cdec92cba1c44";

  // Hash de contraseña con Argon2 (concat pepper como lo hace el sistema)
  const passwordHash = await argon2.hash(password + pepper, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Cifrar datos sensibles
  const encryptedFullName = encryptAES(fullName, aesKey);
  const encryptedDni = encryptAES(dni, aesKey);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName: encryptedFullName,
      dni: encryptedDni,
      role: "superadmin",
      isActive: true,
    },
  });

  console.log("✅ Usuario administrativo creado:");
  console.log(`   Username: ${username}`);
  console.log(`   Role: superadmin`);
  console.log(`   Active: true`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
