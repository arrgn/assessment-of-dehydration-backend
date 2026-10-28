import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as Minio from 'minio';

export type MediaKind = 'image' | 'video';

const EXTENSIONS: Record<MediaKind, Record<string, string>> = {
  image: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  },
  video: {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  },
};

const DEFAULT_MEDIA: Record<MediaKind, string> = {
  image: 'thirst.jpg',
  video: 'thirst.mp4',
};

const STUB_PREFIX = 'not-uploaded';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    const endPoint = config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = Number(config.get('MINIO_PORT', 9000));
    const useSSL = config.get<string>('MINIO_USE_SSL', 'false') === 'true';

    this.bucket = config.get<string>('MINIO_BUCKET', 'dehydration');
    this.baseUrl = `${useSSL ? 'https' : 'http'}://${endPoint}:${port}/${this.bucket}/`;
    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: config.get<string>('MINIO_ACCESS_KEY'),
      secretKey: config.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      if (!(await this.client.bucketExists(this.bucket))) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Бакет "${this.bucket}" создан`);
      }
    } catch (error) {
      this.logger.warn(
        `Не удалось проверить бакет "${this.bucket}": ${String(error)}`,
      );
    }
  }

  mediaUrl(name: string | null, kind: MediaKind): string {
    const isReal = name && !name.startsWith(STUB_PREFIX);
    return this.baseUrl + (isReal ? name : DEFAULT_MEDIA[kind]);
  }

  async upload(file: Express.Multer.File, kind: MediaKind): Promise<string> {
    const extension = EXTENSIONS[kind][file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        `Недопустимый тип файла ${file.mimetype} для поля ${kind}`,
      );
    }

    const name = `${randomUUID()}.${extension}`;
    await this.client.putObject(this.bucket, name, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return name;
  }

  async removeQuietly(...names: string[]): Promise<void> {
    await Promise.all(
      names.map((name) =>
        this.client.removeObject(this.bucket, name).catch((error) => {
          this.logger.warn(`Не удалось удалить ${name}: ${String(error)}`);
        }),
      ),
    );
  }
}
