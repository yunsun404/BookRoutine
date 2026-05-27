import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const book = await prisma.book.create({
    data: {
      title:"데미안",
      author:"헤르만 헤세",
      isbn:"9788985392655",
      book_category:"독일소설",
      cover_url:"https://image.aladin.co.kr/product/2715/39/coversum/8985392654_1.jpg",
      total_pages:212
    }
  })

  console.log("완료!", { book })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())