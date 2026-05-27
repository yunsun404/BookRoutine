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
    return this.prisma.bookshelf.findMany({
      where: { user_id: userId },
      select: {
        bookshelf_id: true,
        progress: true, // float (0.0 ~ 100.0)
        current_page: true,
        status: true,
        created_at: true,
        book: {
          select: {
            title: true,
            cover_url: true, // 실제 컬럼명 확인 필요
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
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
            book: {
              select: {
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
          },
        },
      },
    });
  }
}
