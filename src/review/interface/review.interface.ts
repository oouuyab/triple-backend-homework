import { ActionType, EventType } from 'src/common/types';

export interface ReviewInterface {
  reviewId: string;
  userId: string;
  placeId: string;
  content: string;
  isDel: boolean;
  updateDate: Date;
  regDate: Date;
}

export interface ReviewReqDtoInterface {
  reviewId: string;
  userId: string;
  placeId: string;
  content: string;
  type: EventType;
  action: ActionType;
  attachedPhotoIds: string[];
}
