import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  ILike,
  IsNull,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  DehydrationLike,
  DehydrationSign,
  DehydrationSignStatus,
} from '../entities/dehydration.entity';
import { MinioService } from '../minio/minio.service';
import { LikeSignDto } from './dto/like-sign.dto';
import { PublishSignDto } from './dto/publish-sign.dto';
import { SignFiltersDto } from './dto/sign-filters.dto';
import {
  LikeResult,
  SignFeedItem,
  SignList,
  SignResponse,
} from './sign-response';

export interface SignFiles {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
}

@Injectable()
export class SignsService {
  constructor(
    @InjectRepository(DehydrationSign)
    private readonly signRepository: Repository<DehydrationSign>,
    @InjectRepository(DehydrationLike)
    private readonly likeRepository: Repository<DehydrationLike>,
    private readonly minio: MinioService,
  ) {}

  async getSigns(userId: number, filters: SignFiltersDto): Promise<SignList> {
    const search = filters.search?.trim() || undefined;
    const sliderMax = await this.getMaxCoefficient(search);
    const clamp = (n: number) => Math.min(Math.max(n, 0), sliderMax);
    const from = clamp(filters.min ?? 0);
    const to = clamp(filters.max ?? sliderMax);
    const min = Math.min(from, to);
    const max = Math.max(from, to);
    const hasFilter = min > 0 || max < sliderMax;

    const found = await this.signRepository.find({
      where: {
        status: DehydrationSignStatus.PUBLISHED,
        ...(search && { title: ILike(`%${search}%`) }),
        ...(hasFilter && { dehydratingCoefficient: Between(min, max) }),
      },
      relations: { likes: true },
      order: { id: 'ASC' },
    });

    return {
      signs: found.map((sign) => ({
        ...this.toResponse(sign),
        isMine: sign.creatorId === userId ? 1 : 0,
        likesCount: sign.likes.length,
      })),
      filters: { min, max, sliderMax },
    };
  }

  async getFeedCard(
    userId: number,
    fromId?: number,
    next = false,
  ): Promise<SignFeedItem> {
    const sign = await this.findFeedSign(fromId, next);
    if (!sign) throw new NotFoundException('Лента пуста');

    const liked = await this.likeRepository.existsBy({
      userId,
      signId: sign.id,
    });
    return { ...this.toResponse(sign), isLiked: liked ? 1 : 0 };
  }

  async getDraft(userId: number): Promise<SignResponse> {
    const draft = await this.findDraft(userId);
    if (!draft) throw new NotFoundException('Черновик не найден');
    return this.toResponse(draft);
  }

  async createDraft(
    userId: number,
    title: string,
    files: SignFiles,
  ): Promise<SignResponse> {
    const image = files.image?.[0];
    const video = files.video?.[0];
    if (!image || !video) {
      throw new BadRequestException('Нужны файлы image и video');
    }
    if (await this.findDraft(userId)) {
      throw new ConflictException('Черновик уже существует');
    }

    const uploaded: string[] = [];
    try {
      const imgSrc = await this.minio.upload(image, 'image');
      uploaded.push(imgSrc);
      const vidSrc = await this.minio.upload(video, 'video');
      uploaded.push(vidSrc);

      const sign = await this.signRepository.save(
        this.signRepository.create({
          title,
          creatorId: userId,
          imgSrc,
          vidSrc,
          status: DehydrationSignStatus.DRAFT,
        }),
      );
      return this.toResponse(sign);
    } catch (error) {
      await this.minio.removeQuietly(...uploaded);
      throw error;
    }
  }

  async publish(userId: number, data: PublishSignDto): Promise<SignResponse> {
    const draft = await this.findDraft(userId);
    if (!draft) throw new NotFoundException('Черновик не найден');

    Object.assign(draft, data, { status: DehydrationSignStatus.PUBLISHED });
    return this.toResponse(await this.signRepository.save(draft));
  }

  async remove(id: number, userId: number): Promise<void> {
    const { affected } = await this.signRepository.update(
      { id, creatorId: userId, status: Not(DehydrationSignStatus.DELETED) },
      { status: DehydrationSignStatus.DELETED },
    );
    if (!affected) throw new NotFoundException(`Услуга ${id} не найдена`);
  }

  async setLike(
    signId: number,
    userId: number,
    { like }: LikeSignDto,
  ): Promise<LikeResult> {
    const exists = await this.signRepository.existsBy({
      id: signId,
      status: DehydrationSignStatus.PUBLISHED,
    });
    if (!exists) throw new NotFoundException(`Услуга ${signId} не найдена`);

    if (like === 1) {
      await this.likeRepository
        .createQueryBuilder()
        .insert()
        .values({ userId, signId })
        .orIgnore()
        .execute();
    } else {
      await this.likeRepository.delete({ userId, signId });
    }

    return {
      isLiked: like,
      likesCount: await this.likeRepository.countBy({ signId }),
    };
  }

  private async getMaxCoefficient(search?: string): Promise<number> {
    const sign = await this.signRepository.findOne({
      where: {
        status: DehydrationSignStatus.PUBLISHED,
        dehydratingCoefficient: Not(IsNull()),
        ...(search && { title: ILike(`%${search}%`) }),
      },
      order: { dehydratingCoefficient: 'DESC' },
    });
    return sign?.dehydratingCoefficient ?? 0;
  }

  private findDraft(userId: number): Promise<DehydrationSign | null> {
    return this.signRepository.findOne({
      where: { creatorId: userId, status: DehydrationSignStatus.DRAFT },
    });
  }

  private async findFeedSign(
    fromId: number | undefined,
    next: boolean,
  ): Promise<DehydrationSign | null> {
    const status = DehydrationSignStatus.PUBLISHED;
    const first = () =>
      this.signRepository.findOne({ where: { status }, order: { id: 'ASC' } });
    if (fromId === undefined) return first();

    const found = await this.signRepository.findOne({
      where: {
        status,
        id: next ? MoreThan(fromId) : MoreThanOrEqual(fromId),
      },
      order: { id: 'ASC' },
    });
    return found ?? first();
  }

  private toResponse(sign: DehydrationSign): SignResponse {
    return {
      id: sign.id,
      title: sign.title,
      description: sign.description ?? null,
      dehydratingCoefficient: sign.dehydratingCoefficient ?? null,
      maxDehydratingCoefficient: sign.maxDehydratingCoefficient,
      vidSrc: this.minio.mediaUrl(sign.vidSrc, 'video'),
      imgSrc: this.minio.mediaUrl(sign.imgSrc, 'image'),
      status: sign.status,
      createdAt: sign.createdAt,
      updatedAt: sign.updatedAt,
    };
  }
}
