// titles/dto/set-representative-title.dto.ts
import { IsUUID } from 'class-validator';

export class SetRepresentativeTitleDto {
  @IsUUID()
  title_id!: string;
}