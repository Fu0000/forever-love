import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class NoteMediaDto {
  @ApiPropertyOptional({
    description: 'Public URL returned from /media/upload or /media/presign-upload',
    example: 'https://foever-love.chuhaibox.com/api/v1/media/object/xxxx',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ enum: ['image', 'video'], example: 'image' })
  @IsOptional()
  @IsString()
  @IsIn(['image', 'video'])
  type?: 'image' | 'video';
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ example: '更新后的内容' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ example: 'yellow' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteMediaDto)
  media?: NoteMediaDto | null;
}

