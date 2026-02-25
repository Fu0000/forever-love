import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CupidConversationMessageDto } from './cupid-conversation-message.dto';

export class CreateCupidConversationDto {
  @ApiPropertyOptional({ example: '周末约会灵感' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiProperty({ type: [CupidConversationMessageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CupidConversationMessageDto)
  messages!: CupidConversationMessageDto[];
}

