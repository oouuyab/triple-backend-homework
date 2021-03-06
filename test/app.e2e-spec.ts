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
      it('?????? ??? ?????? & ?????? & ?????? ?????? ????????? 3?????? ???????????????.', async () => {
        const dto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '??????????????? ????????? ???????????????.????????????',
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

      it('?????? ??? ?????? & ?????? ????????? 2?????? ???????????????.', async () => {
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

      it('?????? ??? ?????? ????????? 1?????? ???????????????.', async () => {
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

      it('?????? ??? ?????? ????????? ?????? ?????? placeFirstPoint??? ???????????? ????????????.', async () => {
        const anotherReview = {
          reviewId: uuidV4(),
          content: '?????? ????????? ??? ?????? ???????????????.',
          userId: uuidV4(),
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(anotherReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '?????? ??? ?????? ???????????????.',
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

      it('???????????? ??? ?????? ????????? ?????? ??? ????????????.', async () => {
        const anotherReview = {
          reviewId: uuidV4(),
          content: '????????? ??? ?????? ???????????????.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(anotherReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '????????? ??? ?????? ???????????????.',
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
      it('????????? ????????? ????????? ????????? ??????????????????.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: uuidV4(),
          attachedPhotoIds: [],
          content: '????????? ???????????????.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('????????? ????????? ????????? ??? ????????????.', async () => {
        const deletedReview = {
          reviewId: uuidV4(),
          content: '????????? ???????????????.',
          isDel: true,
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await dataSource.getRepository(ReviewEntity).save(deletedReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: uuidV4(),
          content: '????????? ???????????????.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('?????? ????????? ???????????????.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '?????? ??? ???????????????.',
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        await request(app.getHttpServer()).post('/events').send(prevDto);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'MOD',
          reviewId: prevDto.reviewId,
          content: '????????? ???????????????.',
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

      it('?????? ????????? ????????? ?????? ???????????? ???????????????.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '?????? ??? ???????????????.',
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

      it('?????? ????????? ????????? ?????? ???????????? ???????????????.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          attachedPhotoIds: [uuidV4(), uuidV4()],
          content: '?????? ??? ???????????????.',
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
          content: '?????? ??? ???????????????.',
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
      it('????????? ????????? ????????? ????????? ??????????????????.', async () => {
        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: uuidV4(),
          content: '????????? ??????????????????.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toEqual(ERR_MSG.NOT_FOUND_REVIEW);
      });

      it('?????? ????????? ????????? ????????? ??????????????????.', async () => {
        const deletedReview = new ReviewEntity();
        deletedReview.isDel = true;
        deletedReview.reviewId = uuidV4();
        deletedReview.userId = initUser.userId;
        deletedReview.placeId = initPlace.placeId;
        deletedReview.content = '????????? ???????????????.';

        await dataSource.getRepository(ReviewEntity).save(deletedReview);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: deletedReview.reviewId,
          content: '????????? ??????????????????.',
          attachedPhotoIds: [],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };
        const res = await request(app.getHttpServer()).post('/events').send(dto);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toEqual(ERR_MSG.ALREADY_DELETED_REVIEW);
      });

      it('?????? ?????? ??? isDel ????????? ?????????????????????.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '???????????????.',
          attachedPhotoIds: [uuidV4()],
          userId: initUser.userId,
          placeId: initPlace.placeId,
        };

        await request(app.getHttpServer()).post('/events').send(prevDto);

        const dto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'DELETE',
          reviewId: prevDto.reviewId,
          content: '????????? ??????????????????.',
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

      it('?????? ?????? ??? ???????????? ???????????????.', async () => {
        const prevDto: ReviewReqDto = {
          type: 'REVIEW',
          action: 'ADD',
          reviewId: uuidV4(),
          content: '???????????????.',
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
          content: '????????? ??????????????????.',
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
        content: '??? ?????? ???????????????.',
        userId: initUser.userId,
        placeId: initPlace.placeId,
      };
      await request(app.getHttpServer()).post('/events').send(dto);
    });

    it('???????????? userId??? ????????? ????????? ??????????????????.', async () => {
      const res = await request(app.getHttpServer()).get('/review-point');
      expect(res.statusCode).toBe(404);
    });

    it('userId??? ?????? ?????? ????????? ??????????????????.', async () => {
      const res = await request(app.getHttpServer()).get(`/review-point/${uuidV4()}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual(ERR_MSG.NOT_FOUND_USER);
    });

    it('userId??? ???????????? ???????????????.', async () => {
      const res = await request(app.getHttpServer()).get(`/review-point/${initUser.userId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.userId).toEqual(initUser.userId);
      expect(parseInt(res.body.totalPointAmt)).toEqual(3);
    });
  });
});
