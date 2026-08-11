import { IsString, IsOptional } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  folder_name!: string;

  @IsOptional()
  @IsString()
  folder_image?: string;
}