import { IsNumber, isNumber, IsUUID } from 'class-validator';
import { ReviewPointMstInterface } from '../interface/review-point-mst.interface';

export class PointReqDto implements Pick<ReviewPointMstInterface, 'userId'> {
  @IsUUID('all')
  readonly userId: string;
}

export class ReviewPointResDto
  implements Pick<ReviewPointMstInterface, 'userId' | 'totalPointAmt'>
{
  @IsUUID('all')
  readonly userId: string;

  @IsNumber()
  totalPointAmt: number;
}
