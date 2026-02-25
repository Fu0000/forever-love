import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  private getRequestOrigin(request: Request): string {
    const forwardedProto = request.headers['x-forwarded-proto'];
    const proto =
      (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ??
      request.protocol;
    const forwardedHost = request.headers['x-forwarded-host'];
    const host =
      (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ??
      request.headers.host ??
      '';
    return `${proto}://${host}`;
  }

  @Post('presign-upload')
  @HttpCode(HttpStatus.OK)
  presignUpload(
    @Body() dto: PresignUploadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<{
    objectKey: string;
    putUrl: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    const origin = this.getRequestOrigin(request);
    return this.mediaService.presignUpload(dto, user, origin);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: memoryStorage(),
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<{ objectKey: string; publicUrl: string }> {
    const origin = this.getRequestOrigin(request);
    return this.mediaService.upload(file, user, origin);
  }

  @Public()
  @Get('object/:objectKey')
  async getObject(
    @Param('objectKey') objectKey: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.mediaService.pipeObjectToResponse(objectKey, response);
  }
}
