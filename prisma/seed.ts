import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD ?? "changeme";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      passwordHash: hash,
      displayName: "Admin",
    },
    update: {
      passwordHash: hash,
    },
  });

  console.log('Seeded user "admin" (password from SEED_PASSWORD or "changeme").');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
