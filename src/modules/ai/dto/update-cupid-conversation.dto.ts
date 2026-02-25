import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CupidConversationMessageDto } from './cupid-conversation-message.dto';

export class UpdateCupidConversationDto {
  @ApiPropertyOptional({ example: '新的标题' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ type: [CupidConversationMessageDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CupidConversationMessageDto)
  messages?: CupidConversationMessageDto[];
}

