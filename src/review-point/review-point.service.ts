import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERR_MSG } from '../common/error-msg';
import { Repository } from 'typeorm';
import { ReviewPointResDto } from './dto/point.dto';
import { ReviewPointMstEntity } from './entities/review-point-mst.entity';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class ReviewPointService {
  constructor(
    @InjectRepository(ReviewPointMstEntity)
    private reviewPointMstEntity: Repository<ReviewPointMstEntity>,
    @InjectRepository(UserEntity)
    private userEntity: Repository<UserEntity>,
  ) {}

  async getPointByUserId(userId: string): Promise<ReviewPointResDto> {
    const userInfo = await this.userEntity.findOne({ where: { userId } });
    if (!userInfo) {
      throw new BadRequestException(ERR_MSG.NOT_FOUND_USER);
    }

    const reviewPointMst = await this.reviewPointMstEntity.findOne({
      where: { userId },
    });

    return {
      userId,
      totalPointAmt: reviewPointMst ? reviewPointMst.totalPointAmt : 0,
    };
  }
}
