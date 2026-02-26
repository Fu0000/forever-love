import { IsIn, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RomanticActionDto {
  @ApiProperty({ example: 'evt_abc123' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{6,64}$/)
  clientEventId!: string;

  @ApiProperty({ example: 'stars' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{2,64}$/)
  sceneId!: string;

  @ApiProperty({ example: 'scene_enter', enum: ['scene_enter'] })
  @IsString()
  @IsIn(['scene_enter'])
  action!: 'scene_enter';
}

