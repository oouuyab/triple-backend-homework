import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaceEntity } from '../review/entities/place.entity';
import { ReviewPointDtlEntity } from '../review/entities/review-point-dtl.entity';
import { ReviewPointMstEntity } from '../review/entities/review-point-mst.entity';
import { UserEntity } from '../review/entities/user.entity';
import { AttachPhotoEntity } from './entities/attach-photo.entity';
import { ReviewEntity } from './entities/review.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService],
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PlaceEntity,
      ReviewEntity,
      AttachPhotoEntity,
      ReviewPointMstEntity,
      ReviewPointDtlEntity,
    ]),
  ],
})
export class ReviewModule {}
