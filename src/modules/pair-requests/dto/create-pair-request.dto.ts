import { IsString, Matches } from 'class-validator';

export class CreatePairRequestDto {
  @IsString()
  @Matches(/^(user_[A-Za-z0-9_-]{6,64}|usr_[a-f0-9]{20})$/)
  targetClientUserId!: string;
}
