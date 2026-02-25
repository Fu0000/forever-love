import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CupidConversationMessageDto {
  @ApiProperty({ enum: ['user', 'model'], example: 'user' })
  @IsString()
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @ApiProperty({ example: '我们最近总是吵架，怎么办？' })
  @IsString()
  @MaxLength(4000)
  text!: string;

  @ApiProperty({
    required: false,
    description: 'Client timestamp in ms since epoch',
    example: 1772043006000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9_999_999_999_999)
  timestampMs?: number;
}

