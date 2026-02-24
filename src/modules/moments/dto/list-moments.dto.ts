import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListMomentsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tag?: string;
}
