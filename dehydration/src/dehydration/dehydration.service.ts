import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  ILike,
  IsNull,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import {
  DehydrationLike,
  DehydrationSign,
  DehydrationSignStatus,
} from './entities/dehydration.entity';

export type DehydrationSignWithLikes = Omit<DehydrationSign, 'likes'> & {
  likesCount: number;
};

export interface CreateSignData {
  title: string;
  vidSrc: string | null;
  imgSrc: string | null;
}

export interface PublishSignData {
  title: string;
  description: string;
  dehydratingCoefficient: number;
  maxDehydratingCoefficient: number;
}

@Injectable()
export class DehydrationService {
  constructor(
    @InjectRepository(DehydrationSign)
    private readonly signRepository: Repository<DehydrationSign>,
    @InjectRepository(DehydrationLike)
    private readonly likeRepository: Repository<DehydrationLike>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getDehydrationSignsWithLikes(
    search?: string,
    min?: number,
    max?: number,
  ): Promise<DehydrationSignWithLikes[]> {
    const signs = await this.signRepository.find({
      where: {
        status: Not(DehydrationSignStatus.DELETED),
        ...(search && { title: ILike(`%${search}%`) }),
        ...(min !== undefined &&
          max !== undefined && {
            dehydratingCoefficient: Between(min, max),
          }),
      },
      relations: { likes: true },
      order: { id: 'ASC' },
    });

    return signs.map(({ likes, ...sign }) => ({
      ...sign,
      likesCount: likes.length,
    }));
  }

  async getDehydrationMaxCoefficient(search?: string): Promise<number> {
    const sign = await this.signRepository.findOne({
      where: {
        status: Not(DehydrationSignStatus.DELETED),
        dehydratingCoefficient: Not(IsNull()),
        ...(search && { title: ILike(`%${search}%`) }),
      },
      order: { dehydratingCoefficient: 'DESC' },
    });

    return sign?.dehydratingCoefficient ?? 0;
  }

  async getActiveDehydrationSignFrom(
    id: number,
  ): Promise<DehydrationSign | null> {
    return this.signRepository.findOne({
      where: {
        id: MoreThanOrEqual(id),
        status: Not(DehydrationSignStatus.DELETED),
      },
      order: { id: 'ASC' },
    });
  }

  async getDehydrationDraft(
    creatorId: number,
  ): Promise<DehydrationSign | null> {
    return this.signRepository.findOne({
      where: { creatorId, status: DehydrationSignStatus.DRAFT },
    });
  }

  async createDehydrationDraft(
    creatorId: number,
    data: CreateSignData,
  ): Promise<DehydrationSign> {
    const sign = this.signRepository.create({
      ...data,
      creatorId,
      status: DehydrationSignStatus.DRAFT,
    });
    return this.signRepository.save(sign);
  }

  async publishDehydrationSign(
    id: number,
    creatorId: number,
    data: PublishSignData,
  ): Promise<DehydrationSign> {
    const sign = await this.signRepository.findOne({
      where: { id, creatorId, status: DehydrationSignStatus.DRAFT },
    });

    if (!sign) {
      throw new NotFoundException(`Draft with id ${id} not found`);
    }

    Object.assign(sign, data, { status: DehydrationSignStatus.PUBLISHED });
    return this.signRepository.save(sign);
  }

  async softDeleteDehydrationSign(id: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const [, affected] = (await queryRunner.query(
        `UPDATE "Dehydration_signs"
            SET "status" = $1, "updatedAt" = now()
          WHERE "id" = $2 AND "status" <> $1`,
        [DehydrationSignStatus.DELETED, id],
      )) as [unknown, number];

      if (!affected) {
        throw new NotFoundException(
          `DehydrationSign with id ${id} not found or already deleted`,
        );
      }
    } finally {
      await queryRunner.release();
    }
  }

  async isDehydrationSignLiked(
    userId: number,
    signId: number,
  ): Promise<boolean> {
    return this.likeRepository.existsBy({ userId, signId });
  }
}
