import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contentType?: string;
}
