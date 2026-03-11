import "dotenv/config";
import { auth } from "../app/lib/auth/server";
import { prisma } from "../app/lib/db.server";

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || email;
const role = process.argv[5] || "admin";

if (!email || !password) {
  console.error("Usage: npm run db:create-user <email> <password> [name] [role=admin]");
  process.exit(1);
}

if (role !== "admin" && role !== "user") {
  console.error('Role must be "admin" or "user"');
  process.exit(1);
}

async function main() {
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role, emailVerified: true },
  });

  console.log(`User created: ${result.user.email} (${result.user.id}) — role: ${role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
