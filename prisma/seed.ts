// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// prisma/seed.ts

async function main() {
  await prisma.levelThreshold.createMany({
    data: [
      { level: 1, required_exp: 0, level_name: '새싹 독서가' },
      { level: 2, required_exp: 50, level_name: '꾸준한 독서가' },
      { level: 3, required_exp: 150, level_name: '몰입형 독서가' },
      { level: 4, required_exp: 400, level_name: '숙련된 독서가' },
      { level: 5, required_exp: 1000, level_name: '독서의 달인' },
    ],
    skipDuplicates: true,
  });

  await prisma.title.createMany({
    data: [
      { name: '새싹 독서가', required_level: 1 },   // 수정
      { name: '꾸준한 독서가', required_level: 2 }, // 수정
      { name: '몰입형 독서가', required_level: 3 }, // 수정
      { name: '숙련된 독서가', required_level: 4 }, // 수정
      { name: '독서의 달인', required_level: 5 },   // 수정
    ],
    skipDuplicates: true,
  });

  console.log('시드 데이터 삽입 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })

  .finally(async () => {
    await prisma.$disconnect();
  });