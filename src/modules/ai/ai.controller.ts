import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CupidAdviceDto } from './dto/cupid-advice.dto';
import { CupidLoveNoteDto } from './dto/cupid-love-note.dto';
import { CupidDateIdeasDto } from './dto/cupid-date-ideas.dto';
import { PolishTextDto } from './dto/polish-text.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('cupid/advice')
  async advice(@Body() dto: CupidAdviceDto): Promise<{ text: string }> {
    const text = await this.aiService.cupidAdvice(dto.query);
    return { text };
  }

  @Post('cupid/love-note')
  async loveNote(@Body() dto: CupidLoveNoteDto): Promise<{ text: string }> {
    const text = await this.aiService.cupidLoveNote(dto.mood, dto.partnerName);
    return { text };
  }

  @Post('cupid/date-ideas')
  async dateIdeas(@Body() dto: CupidDateIdeasDto): Promise<string[]> {
    return this.aiService.cupidDateIdeas(dto.interests);
  }

  @Post('polish')
  async polish(@Body() dto: PolishTextDto): Promise<{ text: string }> {
    const text = await this.aiService.polishText(dto.text, dto.scene ?? 'generic');
    return { text };
  }
}
