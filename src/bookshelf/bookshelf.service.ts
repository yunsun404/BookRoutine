import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookshelfDto } from './dto/create-bookshelf.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { AddFolderBookDto } from './dto/add-folder-book.dto';

@Injectable()
export class BookshelfService {
  constructor(private readonly prisma: PrismaService) {}

  // 책장 페이지 → 내 서재 조회
  // 표지, 이름, progress를 한 번에 가져옴
  async getMyBookshelf(userId: string) {
    const bookshelves = await this.prisma.bookshelf.findMany({
      where: { user_id: userId },
      select: {
        bookshelf_id: true,
        progress: true,
        current_page: true,
        status: true,
        created_at: true,
        book: {
          select: {
            book_id: true,
            title: true,
            cover_url: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 폴더에 들어간 book_id 목록
    const folderBooks = await this.prisma.folderBook.findMany({
      where: {
        folder: { user_id: userId },
      },
      select: { book_id: true },
    });

    const bookIdsInFolders = new Set(folderBooks.map((fb) => fb.book_id));

    // 폴더에 없는 책만 반환
    return bookshelves.filter((b) => !bookIdsInFolders.has(b.book.book_id));
  }

  // 폴더 생성
  async createFolder(userId: string, dto: CreateFolderDto) {
    return this.prisma.bookshelfFolder.create({
      data: {
        user_id: userId,
        folder_name: dto.folder_name,
        folder_image: dto.folder_image,
      },
    });
  }

  // 내 폴더 전체 조회
  async getMyFolders(userId: string) {
    return this.prisma.bookshelfFolder.findMany({
      where: { user_id: userId },
      select: {
        folder_id: true,
        folder_name: true,
        folder_image: true,
        created_at: true,
        folder_books: {
          select: {
            folder_book_id: true, // ← 추가
            book: {
              select: {
                book_id: true,
                title: true,
                cover_url: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // 폴더에 책 추가
  async addBookToFolder(folderId: string, dto: AddFolderBookDto) {
    // 이미 추가된 책인지 확인
    const existing = await this.prisma.folderBook.findFirst({
      where: {
        folder_id: folderId,
        book_id: dto.book_id,
      },
    });
    if (existing) throw new ConflictException('이미 폴더에 있는 책입니다.');

    return this.prisma.folderBook.create({
      data: {
        folder_id: folderId,
        book_id: dto.book_id,
      },
    });
  }

  // 폴더 안 책 조회
  async getFolderBooks(folderId: string) {
    return this.prisma.folderBook.findMany({
      where: { folder_id: folderId },
      select: {
        folder_book_id: true,
        book: {
          select: {
            book_id: true,
            title: true,
            cover_url: true,
            bookshelves: {
              // book → bookshelf join
              select: {
                bookshelf_id: true,
                status:true,
              },
              take: 1,
            },
          },
        },
      },
    });
  }
  async getBookDetail(bookshelfId: string) {
    const bookshelf = await this.prisma.bookshelf.findUnique({
      where: { bookshelf_id: bookshelfId },
      select: {
        bookshelf_id: true,
        progress: true,
        current_page: true,
        status: true,
        user_id: true,
        book_id: true, // book_id 직접 가져오기
        book: {
          select: {
            book_id: true,
            title: true,
            author: true,
            cover_url: true,
            total_pages: true,
          },
        },
      },
    });

    if (!bookshelf) return null;

    const reading_goals = await this.prisma.readingGoal.findMany({
      where: {
        user_id: bookshelf.user_id,
        book_id: bookshelf.book_id, // book.book_id 대신 book_id 직접 사용
      },
      select: {
        goal_id: true,
        start_date: true,
        end_date: true,
        period: true,
        daily_pages: true,
        preferred_days: true,
      },
      orderBy: { start_date: 'desc' },
      take: 1,
    });

    return { ...bookshelf, reading_goals };
  }

  // 폴더에서 책 제거
  async removeBookFromFolder(folderId: string, folderBookId: string) {
    return this.prisma.folderBook.delete({
      where: { folder_book_id: folderBookId },
    });
  }

  // 폴더 삭제
  async deleteFolder(folderId: string) {
    // 폴더 안 책들 먼저 삭제 (외래키 제약)
    await this.prisma.folderBook.deleteMany({
      where: { folder_id: folderId },
    });
    return this.prisma.bookshelfFolder.delete({
      where: { folder_id: folderId },
    });
  }
  
}
