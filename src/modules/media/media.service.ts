import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { AppException } from '../../common/errors/app.exception';
import { PresignUploadDto } from './dto/presign-upload.dto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly minioClient: Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly uploadExpirySeconds: number;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('minio.endpoint') as string;
    const port = this.configService.get<number>('minio.port') as number;
    const useSSL = this.configService.get<boolean>('minio.useSSL') as boolean;
    const accessKey = this.configService.get<string>(
      'minio.accessKey',
    ) as string;
    const secretKey = this.configService.get<string>(
      'minio.secretKey',
    ) as string;

    this.bucketName = this.configService.get<string>('minio.bucket') as string;
    this.publicUrl = this.configService.get<string>(
      'minio.publicUrl',
    ) as string;
    this.uploadExpirySeconds = this.configService.get<number>(
      'minio.uploadExpirySeconds',
    ) as number;

    this.minioClient = new Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit(): Promise<void> {
    if (
      process.env.NODE_ENV === 'test' &&
      process.env.MINIO_SKIP_INIT !== 'false'
    ) {
      return;
    }

    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
    }
  }

  async presignUpload(
    dto: PresignUploadDto,
    user: AuthenticatedUser,
  ): Promise<{
    objectKey: string;
    putUrl: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    if (dto.contentType && !dto.contentType.startsWith('image/')) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_CONTENT_TYPE',
        'Only image/* content types are supported',
      );
    }

    const safeFileName = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${user.userId}/${Date.now()}-${safeFileName}`;

    const putUrl = await this.minioClient.presignedPutObject(
      this.bucketName,
      objectKey,
      this.uploadExpirySeconds,
    );

    const publicUrl = this.publicUrl
      ? `${this.publicUrl.replace(/\/$/, '')}/${this.bucketName}/${objectKey}`
      : putUrl.split('?')[0];

    return {
      objectKey,
      putUrl,
      publicUrl,
      expiresIn: this.uploadExpirySeconds,
    };
  }
}
