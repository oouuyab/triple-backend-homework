import { PointType } from '../../common/enum';
import { PointAmtType } from '../../common/types';

export interface ReviewPointDtlInterface {
  reviewPointDtlId: number;
  reviewPointMstId: number;
  reviewId: string;
  pointType: PointType;
  pointAmt: PointAmtType;
  regDate: Date;
}
