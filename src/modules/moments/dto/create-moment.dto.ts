import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMomentDto {
  @ApiProperty({ example: '第一次旅行' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ example: '去了海边...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-02-10' })
  @IsDateString()
  date!: string;

  @ApiProperty({
    example: 'https://foever-love.chuhaibox.com/api/v1/media/object/xxxx',
  })
  @IsString()
  @IsUrl()
  imageUrl!: string;

  @ApiPropertyOptional({ example: ['旅行', '海边'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags?: string[];
}
