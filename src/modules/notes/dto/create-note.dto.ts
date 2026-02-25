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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NoteMediaDto {
  @ApiProperty({
    description: 'Public URL returned from /media/upload or /media/presign-upload',
    example: 'https://foever-love.chuhaibox.com/api/v1/media/object/xxxx',
  })
  @IsString()
  @IsUrl()
  url!: string;

  @ApiProperty({ enum: ['image', 'video'], example: 'image' })
  @IsString()
  @IsIn(['image', 'video'])
  type!: 'image' | 'video';
}

export class CreateNoteDto {
  @ApiProperty({ example: '今天天气真好，想你了。' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ example: 'yellow' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => NoteMediaDto)
  media?: NoteMediaDto;
}
