import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { DataSource, In, MoreThan, Not } from 'typeorm';
import { UserEntity } from '../src/review/entities/user.entity';
import { uuidV4 } from '../src/common/util';
import { PlaceEntity } from '../src/review/entities/place.entity';
import { ReviewEntity } from '../src/review/entities/review.entity';
import { ReviewPointDtlEntity } from '../src/review/entities/review-point-dtl.entity';
import { ReviewPointMstEntity } from '../src/review/entities/review-point-mst.entity';
import { AttachedPhotoEntity } from '../src/review/entities/attached-photo.entity';
import { PointType } from '../src/common/enum';
import { ERR_MSG } from '../src/common/error-msg';
import { ReviewReqDto } from '../src/review/dto/review.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource;
  let initUser: UserEntity;
  let initPlace: PlaceEntity;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(3333);

    dataSource = await app.get(DataSource);

    initUser = await dataSource.getRepository(UserEntity).save({ userId: uuidV4() });
    initPlace = await dataSource.getRepository(PlaceEntity).save({ placeId: uuidV4() });
  });

  afterEach(async () => {
    await dataSource.getRepository(UserEntity).delete({ userId: Not('') });
    await dataSource.getRepository(PlaceEntity).delete({ placeId: Not('') });
    await dataSource.getRepository(ReviewEntity).delete({ reviewId: Not('') });
    await dataSource.getRepository(ReviewPointDtlEntity).delete({ reviewPointDtlId: MoreThan(0) });
    await dataSource.getRepository(ReviewPointMstEntity).delete({ reviewPointMstId: MoreThan(0) });
    await dataSource.getRepository(AttachedPhotoEntity).delete({ attachedPhotoId: Not('') });
    await app.close();
  });

  describe('/events', () => {
    describe('ADD', () => {
      it('지역 첫 번째 & 내용 & 사진 첨부 리뷰는 3점을 획득합니다.', async () => {
        const dto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '안녕하세요 첫번째 리뷰입니다.📸🤟🏻',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const review = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: dto.reviewId } });
        expect(review).not.toBeNull();

        const attachedPhotoList = await dataSource
          .getRepository(AttachedPhotoEntity)
          .find({ where: { attachedPhotoId: In(dto.attachedPhotoIds) } });
        expect(attachedPhotoList.length).toEqual(dto.attachedPhotoIds.length);

        const textPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.TEXT_POINT,
          },
        });
        expect(textPointDtl).not.toBeNull();

        const photoPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PHOTO_POINT,
          },
        });
        expect(photoPointDtl).not.toBeNull();

        const placeFirstPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
          },
        });
        expect(placeFirstPointDtl).not.toBeNull();

        const reviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: dto.userId } });
        expect(parseInt(reviewPointMst.totalPointAmt)).toEqual(3);
      });

      it('지역 첫 번째 & 내용 리뷰는 2점을 획득합니다.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const review = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: dto.reviewId } });
        expect(review).not.toBeNull();

        const attachedPhotoList = await dataSource
          .getRepository(AttachedPhotoEntity)
          .find({ where: { attachedPhotoId: In(dto.attachedPhotoIds) } });
        expect(attachedPhotoList.length).toEqual(dto.attachedPhotoIds.length);

        const textPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.TEXT_POINT,
          },
        });
        expect(textPointDtl).toBeNull();

        const photoPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PHOTO_POINT,
          },
        });
        expect(photoPointDtl).not.toBeNull();

        const placeFirstPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
          },
        });
        expect(placeFirstPointDtl).not.toBeNull();

        const reviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: dto.userId } });
        expect(parseInt(reviewPointMst.totalPointAmt)).toEqual(2);
      });

      it('지역 첫 번째 리뷰는 1점을 획득합니다.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const review = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: dto.reviewId } });
        expect(review).not.toBeNull();

        const attachedPhotoList = await dataSource
          .getRepository(AttachedPhotoEntity)
          .find({ where: { attachedPhotoId: In(dto.attachedPhotoIds) } });
        expect(attachedPhotoList.length).toEqual(dto.attachedPhotoIds.length);

        const textPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.TEXT_POINT,
          },
        });
        expect(textPointDtl).toBeNull();

        const photoPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PHOTO_POINT,
          },
        });
        expect(photoPointDtl).toBeNull();

        const placeFirstPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
          },
        });
        expect(placeFirstPointDtl).not.toBeNull();

        const reviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: dto.userId } });
        expect(parseInt(reviewPointMst.totalPointAmt)).toEqual(1);
      });

      it('지역 첫 번째 리뷰가 아닌 경우 placeFirstPoint를 획득하지 않습니다.', async () => {
        const anotherReview = {
          reviewId: uuidV4(),
          content: '다른 유저의 첫 번쨰 리뷰입니다.',
          userId: uuidV4(),
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(anotherReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '지역 두 번째 리뷰입니다.',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const review = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: dto.reviewId } });
        expect(review).not.toBeNull();

        const attachedPhotoList = await dataSource
          .getRepository(AttachedPhotoEntity)
          .find({ where: { attachedPhotoId: In(dto.attachedPhotoIds) } });
        expect(attachedPhotoList.length).toEqual(dto.attachedPhotoIds.length);

        const textPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.TEXT_POINT,
          },
        });
        expect(textPointDtl).not.toBeNull();

        const photoPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PHOTO_POINT,
          },
        });
        expect(photoPointDtl).not.toBeNull();

        const placeFirstPointDtl = await dataSource.getRepository(ReviewPointDtlEntity).findOne({
          where: {
            reviewId: dto.reviewId,
            pointType: PointType.PLACE_FIRST_POINT,
          },
        });
        expect(placeFirstPointDtl).toBeNull();

        const reviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: dto.userId } });
        expect(parseInt(reviewPointMst.totalPointAmt)).toEqual(2);
      });

      it('지역에는 한 번의 리뷰만 남길 수 있습니다.', async () => {
        const anotherReview = {
          reviewId: uuidV4(),
          content: '유저의 첫 번쨰 리뷰입니다.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(anotherReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '유저의 두 번째 리뷰입니다.',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(ERR_MSG.ALREADY_WRITE_REVIEW);
      });
    });

    describe('MOD', () => {
      it('작성된 리뷰가 없다면 에러를 발생시킵니다.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: uuidV4(),
          attachedPhotoIds: [],
          content: '리뷰를 수정합니다.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('삭제된 리뷰는 수정할 수 없습니다.', async () => {
        const deletedReview = {
          reviewId: uuidV4(),
          content: '삭제된 리뷰입니다.',
          isDel: true,
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(deletedReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: uuidV4(),
          content: '리뷰를 수정합니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('리뷰 내용을 수정합니다.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '수정 전 리뷰입니다.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await request(app.getHttpServer()).post('/events').send(prevDto);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: prevDto.reviewId,
          content: '리뷰를 수정합니다.',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const afterReview = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: prevDto.reviewId } });
        expect(afterReview.content).toEqual(dto.content);
      });

      it('리뷰 내용이 없으면 리뷰 포인트를 반환합니다.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '수정 전 리뷰입니다.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await request(app.getHttpServer()).post('/events').send(prevDto);

        const prevReviewPointDtl = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: prevDto.reviewId } });
        const prevTextPointDtl = prevReviewPointDtl.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.TEXT_POINT,
        );
        expect(prevTextPointDtl.length).toEqual(1);
        expect(parseInt(prevTextPointDtl[0].pointAmt)).toEqual(1);

        const prevReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(prevReviewPointMst.totalPointAmt)).toEqual(3);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: prevDto.reviewId,
          content: '',
          attachedPhotoIds: [uuidV4(), uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const afterReview = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: prevDto.reviewId } });
        expect(afterReview.content).toEqual(dto.content);

        const afterReviewPointDtl = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: dto.reviewId } });
        const afterTextPointDtl = afterReviewPointDtl.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.TEXT_POINT,
        );
        expect(afterTextPointDtl.length).toEqual(2);
        expect(parseInt(afterTextPointDtl[0].pointAmt)).toEqual(1);
        expect(parseInt(afterTextPointDtl[1].pointAmt)).toEqual(-1);

        const afterReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(afterReviewPointMst.totalPointAmt)).toEqual(2);
      });

      it('리뷰 내용이 없으면 리뷰 포인트를 반환합니다.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '수정 전 리뷰입니다.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await request(app.getHttpServer()).post('/events').send(prevDto);

        const prevReviewPointDtl = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: prevDto.reviewId } });
        const prevPhotoPointDtl = prevReviewPointDtl.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PHOTO_POINT,
        );
        expect(prevPhotoPointDtl.length).toEqual(1);
        expect(parseInt(prevPhotoPointDtl[0].pointAmt)).toEqual(1);

        const prevReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(prevReviewPointMst.totalPointAmt)).toEqual(3);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: prevDto.reviewId,
          content: '수정 후 리뷰입니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        for (const attachedPhotoId of prevDto.attachedPhotoIds) {
          await dataSource
            .getRepository(AttachedPhotoEntity)
            .findOne({ where: { attachedPhotoId } });
        }

        const afterReview = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: prevDto.reviewId } });
        expect(afterReview.content).toEqual(dto.content);

        const afterReviewPointDtl = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: dto.reviewId } });
        const afterPhotoPointDtl = afterReviewPointDtl.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PHOTO_POINT,
        );
        expect(afterPhotoPointDtl.length).toEqual(2);
        expect(parseInt(afterPhotoPointDtl[0].pointAmt)).toEqual(1);
        expect(parseInt(afterPhotoPointDtl[1].pointAmt)).toEqual(-1);

        const afterReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(afterReviewPointMst.totalPointAmt)).toEqual(2);
      });
    });

    describe('DELETE', () => {
      it('작성된 리뷰가 없다면 에러를 발생시킵니다.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: uuidV4(),
          content: '삭제를 해보겠습니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toEqual(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('이미 삭제된 리뷰는 에러를 발생시킵니다.', async () => {
        const deletedReview = new ReviewEntity();
        deletedReview.isDel = true;
        deletedReview.reviewId = uuidV4();
        deletedReview.userId = initUser.userId;
        deletedReview.placeId = initPlace.placeId;
        deletedReview.content = '삭제된 리뷰입니다.';

        await dataSource.getRepository(ReviewEntity).save(deletedReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: deletedReview.reviewId,
          content: '삭제를 해보겠습니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toEqual(ERR_MSG.ALREADY_DELETED_REVIEW);
      });

      it('삭제 성공 시 isDel 상태를 업데이트합니다.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '리뷰입니다.',
          attachedPhotoIds: [uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        await request(app.getHttpServer()).post('/events').send(prevDto);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: prevDto.reviewId,
          content: '삭제를 해보겠습니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const review = await dataSource
          .getRepository(ReviewEntity)
          .findOne({ where: { reviewId: dto.reviewId } });
        expect(review.isDel).toEqual(true);

        const attachedPhoto = await dataSource
          .getRepository(AttachedPhotoEntity)
          .findOne({ where: { attachedPhotoId: prevDto.attachedPhotoIds[0] } });
        expect(attachedPhoto.isDel).toEqual(true);
      });

      it('삭제 성공 시 포인트를 반환합니다.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '리뷰입니다.',
          attachedPhotoIds: [uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        await request(app.getHttpServer()).post('/events').send(prevDto);

        const prevReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(prevReviewPointMst.totalPointAmt)).toEqual(3);

        const prevReviewPointDtlList = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: prevDto.reviewId } });
        expect(prevReviewPointDtlList.length).toEqual(3);

        const prevTextPointDtl = prevReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.TEXT_POINT,
        );
        expect(prevTextPointDtl.length).toEqual(1);
        expect(parseInt(prevTextPointDtl[0].pointAmt)).toEqual(1);

        const prevPhotoPointDtl = prevReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PHOTO_POINT,
        );
        expect(prevPhotoPointDtl.length).toEqual(1);
        expect(parseInt(prevPhotoPointDtl[0].pointAmt)).toEqual(1);

        const prevPlaceFirstPointDtl = prevReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PLACE_FIRST_POINT,
        );
        expect(prevPlaceFirstPointDtl.length).toEqual(1);
        expect(parseInt(prevPlaceFirstPointDtl[0].pointAmt)).toEqual(1);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: prevDto.reviewId,
          content: '삭제를 해보겠습니다.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(201);

        const afterReviewPointMst = await dataSource
          .getRepository(ReviewPointMstEntity)
          .findOne({ where: { userId: prevDto.userId } });
        expect(parseInt(afterReviewPointMst.totalPointAmt)).toEqual(0);

        const afterReviewPointDtlList = await dataSource
          .getRepository(ReviewPointDtlEntity)
          .find({ where: { reviewId: prevDto.reviewId } });
        expect(afterReviewPointDtlList.length).toEqual(6);

        const afterTextPointDtl = afterReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.TEXT_POINT,
        );
        expect(afterTextPointDtl.length).toEqual(2);
        expect(parseInt(afterTextPointDtl[0].pointAmt)).toEqual(1);
        expect(parseInt(afterTextPointDtl[1].pointAmt)).toEqual(-1);

        const afterPhotoPointDtl = afterReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PHOTO_POINT,
        );
        expect(afterPhotoPointDtl.length).toEqual(2);
        expect(parseInt(afterPhotoPointDtl[0].pointAmt)).toEqual(1);
        expect(parseInt(afterPhotoPointDtl[1].pointAmt)).toEqual(-1);

        const afterPlaceFirstPointDtl = afterReviewPointDtlList.filter(
          (reviewPointDtl) => reviewPointDtl.pointType === PointType.PLACE_FIRST_POINT,
        );
        expect(afterPlaceFirstPointDtl.length).toEqual(2);
        expect(parseInt(afterPlaceFirstPointDtl[0].pointAmt)).toEqual(1);
        expect(parseInt(afterPlaceFirstPointDtl[1].pointAmt)).toEqual(-1);
      });
    });
  });

  describe('/review-point', () => {
    let reviewId;
    beforeEach(async () => {
      reviewId = uuidV4();

      const dto: ReviewReqDto = {
        reviewId,
        type: 'REVIEW',
        action: 'ADD',
        attachedPhotoIds: [uuidV4(), uuidV4()],
        content: '첫 번쨰 리뷰입니다.',
        userId: initUser.userId,
        placeId: initPlace.placeId,
      };
      await request(app.getHttpServer()).post('/events').send(dto);
    });

    it('입력받은 userId가 없으면 에러를 발생시킵니다.', async () => {
      const res = await request(app.getHttpServer()).get('/review-point');
      expect(res.statusCode).toBe(404);
    });

    it('userId가 없는 경우 에러를 발생시킵니다.', async () => {
      const res = await request(app.getHttpServer()).get(`/review-point/${uuidV4()}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual(ERR_MSG.NOT_FOUND_USER);
    });

    it('userId의 포인트를 조회합니다.', async () => {
      const res = await request(app.getHttpServer()).get(`/review-point/${initUser.userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.userId).toEqual(initUser.userId);
      expect(parseInt(res.body.totalPointAmt)).toEqual(3);
    });
  });
});
