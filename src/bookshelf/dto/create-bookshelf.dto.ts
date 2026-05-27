import { IsString } from 'class-validator';

export class CreateBookshelfDto {
  @IsString()
  book_id!: string;
}