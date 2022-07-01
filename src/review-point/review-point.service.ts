import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERR_MSG } from '../common/error-msg';
import { Repository } from 'typeorm';
import { ReviewPointResDto } from './dto/point.dto';
import { ReviewPointMstEntity } from './entities/review.point-mst.entity';

@Injectable()
export class ReviewPointService {
  constructor(
    @InjectRepository(ReviewPointMstEntity)
    private reviewPointMstEntity: Repository<ReviewPointMstEntity>,
  ) {}

  async getPointByUserId(userId: string): Promise<ReviewPointResDto> {
    try {
      const reviewPointMst = await this.reviewPointMstEntity.findOne({
        where: { userId },
      });

      return {
        userId: reviewPointMst.userId,
        totalPointAmt: reviewPointMst.totalPointAmt,
      };
    } catch (err) {
      throw new BadRequestException(ERR_MSG.NOT_FOUND_USER);
    }
  }
}
