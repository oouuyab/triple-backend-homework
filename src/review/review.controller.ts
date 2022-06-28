import { Body, Controller, Param, Post } from '@nestjs/common';
import { ReviewReqDto } from './dto/review.dto';
import { ReviewService } from './review.service';

@Controller('/events')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async postReview(@Body() body: ReviewReqDto): Promise<void> {
    await this.reviewService.postReview(body);
  }
}
