// db에 쉽게 데이터를 넣기 위한 페이지

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 기존 유저 업데이트 (새로 만들지 않고 기존 데이터 수정)
  const user = await prisma.book.create({
    data: {
      title: "죄와 벌-완역본",
      author: "표도르 도스토예프스키",
      isbn: "9788993800654",
      book_category: "러시아 소설",
      cover_url:"https://image.aladin.co.kr/product/1122/96/coversum/8993800650_1.jpg",
      total_pages: 607,
      source:"알라딘",
    }
  })

  console.log("완료!", { user })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())