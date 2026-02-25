import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { AppException } from '../../common/errors/app.exception';
import { PresignUploadDto } from './dto/presign-upload.dto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { Response } from 'express';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly minioClient: Client;
  private readonly bucketName: string;
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
    origin: string,
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

    const publicUrl = this.buildProxyPublicUrl(origin, objectKey);

    return {
      objectKey,
      putUrl,
      publicUrl,
      expiresIn: this.uploadExpirySeconds,
    };
  }

  private buildProxyPublicUrl(origin: string, objectKey: string): string {
    const encodedKey = Buffer.from(objectKey).toString('base64url');
    return `${origin.replace(/\/$/, '')}/api/v1/media/object/${encodedKey}`;
  }

  async upload(
    file: Express.Multer.File,
    user: AuthenticatedUser,
    origin: string,
  ): Promise<{ objectKey: string; publicUrl: string }> {
    if (!file) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'FILE_REQUIRED',
        'File is required',
      );
    }

    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_CONTENT_TYPE',
        'Only image/* content types are supported',
      );
    }

    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `uploads/${user.userId}/${Date.now()}-${safeFileName}`;

    await this.minioClient.putObject(
      this.bucketName,
      objectKey,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype || 'application/octet-stream',
      },
    );

    return {
      objectKey,
      publicUrl: this.buildProxyPublicUrl(origin, objectKey),
    };
  }

  async pipeObjectToResponse(
    encodedObjectKey: string,
    response: Response,
  ): Promise<void> {
    let objectKey: string;
    try {
      objectKey = Buffer.from(encodedObjectKey, 'base64url').toString('utf8');
    } catch (error) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_OBJECT_KEY',
        'Invalid object key',
      );
    }

    const stat = await this.minioClient.statObject(this.bucketName, objectKey);
    const contentType =
      (stat.metaData?.['content-type'] as string | undefined) ??
      (stat.metaData?.['Content-Type'] as string | undefined) ??
      'application/octet-stream';

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = await this.minioClient.getObject(this.bucketName, objectKey);
    stream.on('error', () => {
      response.status(404).end();
    });
    stream.pipe(response);
  }
}
