import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BookshelfService } from './bookshelf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { AddFolderBookDto } from './dto/add-folder-book.dto';
import { Delete } from '@nestjs/common';

//@UseGuards(JwtAuthGuard)
@Controller('bookshelf')
export class BookshelfController {
  constructor(private readonly bookshelfService: BookshelfService) {}

  @Get()
  getMyBookshelf(@Req() req) {
    //return this.bookshelfService.getMyBookshelf(req.user.sub);
    return this.bookshelfService.getMyBookshelf(
      '7ff77428-bdab-4724-9a67-ed5587217978',
    );
  }

  // 폴더 생성
  @Post('folders')
  createFolder(@Req() req, @Body() dto: CreateFolderDto) {
    return this.bookshelfService.createFolder(
      '7ff77428-bdab-4724-9a67-ed5587217978',
      dto,
    );
  }

  // 내 폴더 조회
  @Get('folders')
  getMyFolders(@Req() req) {
    return this.bookshelfService.getMyFolders(
      '7ff77428-bdab-4724-9a67-ed5587217978',
    );
  }

  // 폴더에 책 추가
  @Post('folders/:folder_id/books')
  addBookToFolder(
    @Param('folder_id') folderId: string,
    @Body() dto: AddFolderBookDto,
  ) {
    return this.bookshelfService.addBookToFolder(folderId, dto);
  }

  // 폴더 안 책 조회
  @Get('folders/:folder_id/books')
  getFolderBooks(@Param('folder_id') folderId: string) {
    return this.bookshelfService.getFolderBooks(folderId);
  }

  @Get(':bookshelf_id')
  getBookDetail(@Param('bookshelf_id') bookshelfId: string) {
    return this.bookshelfService.getBookDetail(bookshelfId);
  }

  // 폴더에서 책 제거
  @Delete('folders/:folder_id/books/:folder_book_id')
  removeBookFromFolder(
    @Param('folder_id') folderId: string,
    @Param('folder_book_id') folderBookId: string,
  ) {
    return this.bookshelfService.removeBookFromFolder(folderId, folderBookId);
  }

  // 폴더 삭제
  @Delete('folders/:folder_id')
  deleteFolder(@Param('folder_id') folderId: string) {
    return this.bookshelfService.deleteFolder(folderId);
  }
}
