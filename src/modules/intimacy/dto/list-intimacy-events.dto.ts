import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListIntimacyEventsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user id', example: 'usr_xxx' })
  @IsOptional()
  @IsString()
  userId?: string;
}

