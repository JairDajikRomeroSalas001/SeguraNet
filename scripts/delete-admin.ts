import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({
    where: { username: "admin1" },
  });
  console.log("Usuario eliminado");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
