import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActionTypeLikeEnum, EventTypeLikeEnum } from 'src/common/enum';
import { ActionType, EventType } from 'src/common/types';
import { ReviewReqDtoInterface } from '../interface/review.interface';

export class ReviewReqDto implements ReviewReqDtoInterface {
  @IsEnum(EventTypeLikeEnum)
  readonly type: EventType;

  @IsEnum(ActionTypeLikeEnum)
  readonly action: ActionType;

  @IsUUID('all')
  readonly reviewId: string;

  @MaxLength(500)
  @IsString()
  readonly content: string;

  @IsUUID('all', { each: true })
  readonly attachedPhotoIds: string[];

  @IsUUID('all')
  readonly userId: string;

  @IsUUID('all')
  readonly placeId: string;
}
