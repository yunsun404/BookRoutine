import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// GET /api/v1/ebooks
export class ListEbooksDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// POST /api/v1/ebooks/reading
// bookId -> 내부적으로 Book.book_id 참조
export class StartReadingDto {
  @IsUUID()
  bookId!: string;
}

// 프론트에서 5~10초 단위로 집계한 버킷 하나
export class FocusSampleInputDto {
  @IsDateString()
  bucketStart!: string;

  @IsDateString()
  bucketEnd!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  focusedRatio!: number;

  @IsOptional()
  @IsBoolean()
  faceDetected?: boolean;

  @IsOptional()
  @IsBoolean()
  interruption?: boolean;

  @IsOptional()
  @IsNumber()
  avgYaw?: number;

  @IsOptional()
  @IsNumber()
  avgPitch?: number;
}

// POST /api/v1/ebooks/reading/focus
export class FocusBatchDto {
  @IsUUID()
  sessionId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FocusSampleInputDto)
  samples!: FocusSampleInputDto[];
}

// PATCH /api/v1/ebooks/reading/end
export class EndReadingDto {
  @IsUUID()
  sessionId!: string;

  // 종료 직전 마지막 배치를 같이 보내고 싶을 때 (선택)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FocusSampleInputDto)
  samples?: FocusSampleInputDto[];
}

// GET /api/v1/ebooks/me/history
export class HistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}