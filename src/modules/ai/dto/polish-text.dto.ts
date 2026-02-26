import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PolishTextDto {
  @ApiProperty({ example: '今天和你一起散步，感觉很幸福。' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;

  @ApiPropertyOptional({
    example: 'note',
    enum: ['note', 'moment', 'quest', 'generic'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['note', 'moment', 'quest', 'generic'])
  scene?: 'note' | 'moment' | 'quest' | 'generic';
}

