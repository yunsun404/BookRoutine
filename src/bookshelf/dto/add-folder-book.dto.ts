import { IsString } from 'class-validator';

export class AddFolderBookDto {
  @IsString()
  book_id!: string;
}