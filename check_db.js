const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, email: u.email, discountBalance: u.discountBalance, referredUsers: u.referredUsers })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
