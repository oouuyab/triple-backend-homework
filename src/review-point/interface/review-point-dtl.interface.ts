import { PointType } from 'src/common/enum';
import { PointAmtType } from 'src/common/types';

export interface ReviewPointDtlInterface {
  reviewPointDtlId: number;
  reviewPointMstId: number;
  reviewId: string;
  pointType: PointType;
  pointAmt: PointAmtType;
  regDate: Date;
}
