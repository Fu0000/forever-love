import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListMomentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by tag', example: '旅行' })
  @IsOptional()
  @IsString()
  tag?: string;
}
