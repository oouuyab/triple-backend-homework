import { Body, Controller, Get } from '@nestjs/common';
import { PointReqDto, ReviewPointResDto } from './dto/point.dto';
import { ReviewPointService } from './review-point.service';

@Controller('/review-point')
export class ReviewPointController {
  constructor(private readonly reviewPointService: ReviewPointService) {}
  @Get()
  async getPoint(@Body() body: PointReqDto): Promise<ReviewPointResDto> {
    return await this.reviewPointService.getPointByUserId(body);
  }
}
