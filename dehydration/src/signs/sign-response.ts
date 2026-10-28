import { DehydrationSignStatus } from '../entities/dehydration.entity';

export interface SignResponse {
  id: number;
  title: string;
  description: string | null;
  dehydratingCoefficient: number | null;
  maxDehydratingCoefficient: number;
  vidSrc: string;
  imgSrc: string;
  status: DehydrationSignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type SignListItem = SignResponse & {
  isMine: 0 | 1;
  likesCount: number;
};

export type SignFeedItem = SignResponse & { isLiked: 0 | 1 };

export interface SignList {
  signs: SignListItem[];
  filters: { min: number; max: number; sliderMax: number };
}

export interface LikeResult {
  isLiked: 0 | 1;
  likesCount: number;
}
