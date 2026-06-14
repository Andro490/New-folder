import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const affiliateCode = '68K5GQ';
  const affiliate = await prisma.user.findUnique({ where: { affiliateCode } });
  if (affiliate) {
    console.log("Found affiliate:", affiliate.email, affiliate.discountBalance);
    await prisma.user.update({
      where: { id: affiliate.id },
      data: {
        discountBalance: { increment: 50 },
        referredUsers: { increment: 1 }
      }
    });
    console.log("Updated!");
  } else {
    console.log("Affiliate not found.");
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
