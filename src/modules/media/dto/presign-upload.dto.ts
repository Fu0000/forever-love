import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignUploadDto {
  @ApiProperty({ example: 'avatar.svg' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @ApiPropertyOptional({ example: 'image/svg+xml' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contentType?: string;
}
