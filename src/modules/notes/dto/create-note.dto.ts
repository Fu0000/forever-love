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

class NoteMediaDto {
  @IsString()
  @IsUrl()
  url!: string;

  @IsString()
  @IsIn(['image', 'video'])
  type!: 'image' | 'video';
}

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NoteMediaDto)
  media?: NoteMediaDto;
}
