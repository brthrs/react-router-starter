import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../app/lib/db.server";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npm run db:create-user <email> <password>");
  process.exit(1);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    console.error(`User with email "${email}" already exists.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  console.log(`User created: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
