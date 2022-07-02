# Triple Backend Homework

## 실행 방법

### Script

```
서버 실행 : npm run start
유닛 테스트 실행: npm run test
E2E 테스트 실행: npm run test:e2e
```

### SPECIFICATIONS

🔥 **주의사항**

- `reviewId`, `attachedPhotoId`, `userId`, `placeId`는 UUID 포맷입니다.
- `user`와 `place`를 생성하는 api는 없기 때문에 db에 생성되어있는 `userId`, `placeId`를 사용해야합니다.
- 초기 생성되어있는 `userId`와 `placeId`를 사용해주세요!
  ```
  userId: "3ede0ef2-92b7-4817-a5f3-0c575361f745"
  placeId: "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
  ```

#### ✍️ 리뷰 생성

```
POST /events

{
"type": "REVIEW",
"action": "ADD",
"reviewId": "240a0658-dc5f-4878-9381-ebb7b2667772",
"content": "좋아요!",
"attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-
851d-4a50-bb07-9cc15cbdc332"],
 "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f745",
 "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
}
```

#### 🛠 리뷰 수정

```
POST /events

{
"type": "REVIEW",
"action": "MOD",
"reviewId": "240a0658-dc5f-4878-9381-ebb7b2667772",
"content": "너무 좋아요!",
"attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb9", "afb0cef2-
851d-4a50-bb07-9cc15cbdc333"],
 "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f745",
 "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
}
```

#### 🗑 리뷰 삭제

```
POST /events

{
"type": "REVIEW",
"action": "DELETE",
"reviewId": "240a0658-dc5f-4878-9381-ebb7b2667772",
"content": " !",
"attachedPhotoIds": ["e4d1a64e-a531-46de-88d0-ff0ed70c0bb8", "afb0cef2-
851d-4a50-bb07-9cc15cbdc332"],
 "userId": "3ede0ef2-92b7-4817-a5f3-0c575361f745",
 "placeId": "2e4baf1c-5acb-4efb-a1af-eddada31b00f"
}
```

#### 🅿️ 포인트 조회

```
GET /review-point/:userId
```

---

## 기술 스택

```
Typescript
Node v16.15.1
NestJS v8.2.8
TypeORM v0.3.6
MySql v8
```

---

## DB DDL

- 외래키 설정은 하지 않았고, 테이블간 관계는 코드레벨에서 Entity에 설정했습니다.

### 유저 테이블

- 유저 정보가 담겨있는 테이블입니다.

```sql
CREATE TABLE tb_user (
    user_id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'user id',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date'
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT 'user table';
```

### 장소 테이블

- 장소 정보가 담겨있는 테이블입니다.

```sql
CREATE TABLE tb_place (
    place_id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'place id',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date'
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT 'place table';
```

### 리뷰 테이블

- 고객이 작성한 리뷰 정보가 담긴 테이블입니다.
- `is_del`을 리뷰 삭제 플래그로 사용합니다.
- 리뷰 수정 혹은 삭제 시 `update_date`가 업데이트됩니다.
- `content`에 이모지가 들어갈 경우를 대비해 테이블의 CHARSET을 `utf8mb4`로 설정합니다.

```sql
CREATE TABLE tb_review (
    review_id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'review id',
    user_id VARCHAR(36) NOT NULL COMMENT 'user id',
    place_id VARCHAR(36) NOT NULL COMMENT 'place_id',
    content VARCHAR(500) NOT NULL DEFAULT '' COMMENT 'content',
    is_del BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'is delete',
    update_date DATETIME NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'update date',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',

    INDEX idx_tb_review_01 (user_id),
    INDEX idx_tb_review_02 (place_id),
    INDEX idx_tb_review_03 (is_del)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'review table';
```

### 첨부 사진 테이블

- `is_del`을 첨부 사진 삭제 플레그로 사용합니다.
- 첨부사진 삭제 시 `update_date`가 업데이트됩니다.

```sql
CREATE TABLE tb_attached_photo (
    attached_photo_id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'review attached photo id',
    review_id VARCHAR(36) NOT NULL COMMENT 'review id',
    is_del BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'is delete',
    update_date DATETIME NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'update date',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',

    INDEX idx_tb_attached_photo_01 (review_id),
    INDEX idx_tb_attached_photo_02 (is_del)
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT 'review attached photo table';
```

### 포인트 마스터 테이블

- `total_point_amt`는 현재 고객이 보유하고 있는 리뷰 포인트의 총 합입니다.

```sql
CREATE TABLE tb_review_point_mst (
    review_point_mst_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'point master id',
    user_id VARCHAR(36) NOT NULL COMMENT 'user id',
    total_point_amt BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'total point amount',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',

    INDEX idx_tb_review_point_mst_01 (user_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT 'review point master table';
```

### 포인트 디테일 테이블

- 해당 테이블은 리뷰 작성, 수정, 삭제에 이벤트에 따른 포인트 적립 및 회수에 대한 정보가 담기는 테이블입니다.
- 해당 테이블은 tb_review_point_mst의 total_point_amt를 계산할 때 사용하며, 포인트 적립 및 회수 히스토리를 확인할 때 사용합니다.
- `point_type`를 사용해 point의 속성을 알 수 있습니다.
- `point_amt`는 포인트 값이며 회수에 대한 정보를 갖고 있어야 하기 때문에 음수와 양수 모두 가능합니다.
- 아쉬운 점: point_type으로 포인트 적립 및 회수의 이유가 리뷰의 내용, 사진 첨부, 장소 첫 번째 리뷰인지 알 수 있지만 리뷰의 생성, 수정, 삭제에 대한 정보를 직접적으로 알 수 없는 아쉬움이 있습니다. 개선 방법으로 enum type의 컬럼을 추가해 구분하거나 varchar type의 memo 컬럼을 추가해 해결할 수 있을 것이라 생각합니다.'

```sql
CREATE TABLE tb_review_point_dtl (
    review_point_dtl_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'point detail id',
    review_point_mst_id BIGINT UNSIGNED NOT NULL COMMENT 'point master id',
    review_id VARCHAR(36) NOT NULL COMMENT 'review id',
    point_type TINYINT(4) UNSIGNED NOT NULL COMMENT '0: default, 1: text_point 2: photo_point, 3: place_first_review_point',
    point_amt BIGINT NOT NULL DEFAULT 0 COMMENT 'point amount',
    reg_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',

    INDEX idx_tb_review_point_dtl_01 (review_point_mst_id),
    INDEX idx_tb_review_point_dtl_02 (review_id),
    INDEX idx_tb_review_point_dtl_03 (point_type)
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT 'review point detail table';
```
