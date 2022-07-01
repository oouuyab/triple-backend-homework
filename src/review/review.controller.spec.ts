import { Test, TestingModule } from '@nestjs/testing';
import { ActionType, EventType } from '../common/types';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
  let controller: ReviewController;
  const mockReviewService = {
    postReview: jest.fn((dto) => {}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [ReviewService],
    })
      .overrideProvider(ReviewService)
      .useValue(mockReviewService)
      .compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be define', () => {
    expect(controller).toBeDefined();
  });

  it('postReview test', async () => {
    const dto = {
      type: 'REVIEW' as EventType,
      action: 'ADD' as ActionType,
      reviewId: '240a0658-dc5f-4878-9381-ebb7b2667772',
      content: '리뷰!',
      attachedPhotoIds: [
        'e4d1a64e-a531-46de-88d0-ff0ed70c0bb8',
        'afb0cef2-851d-4a50-bb07-9cc15cbdc332',
      ],
      userId: '3ede0ef2-92b7-4817-a5f3-0c575361f745',
      placeId: '2e4baf1c-5acb-4efb-a1af-eddada31b00f',
    };

    expect(await controller.postReview(dto)).toBe(void 0);
  });
});
