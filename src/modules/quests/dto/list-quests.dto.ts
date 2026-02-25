import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListQuestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['active', 'completed'], example: 'active' })
  @IsOptional()
  @IsIn(['active', 'completed'])
  status?: 'active' | 'completed';
}
