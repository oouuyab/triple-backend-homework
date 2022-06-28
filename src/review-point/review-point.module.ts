import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewPointDtlEntity } from './entities/review-point-dtl.entity';
import { ReviewPointMstEntity } from './entities/review.point-mst.entity';
import { UserEntity } from './entities/user.entity';
import { ReviewPointController } from './review-point.controller';
import { ReviewPointService } from './review-point.service';

@Module({
  controllers: [ReviewPointController],
  providers: [ReviewPointService],
  imports: [TypeOrmModule.forFeature([ReviewPointMstEntity, ReviewPointDtlEntity, UserEntity])],
})
export class ReviewPointModule {}
