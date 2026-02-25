import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListNotesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by author id', example: 'usr_xxx' })
  @IsOptional()
  @IsString()
  authorId?: string;
}
