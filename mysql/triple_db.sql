-- MySQL dump 10.13  Distrib 8.0.28, for Linux (x86_64)
--
-- Host: localhost    Database: triple_db
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
-- SET TIME_ZONE='+09:00'
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tb_attached_photo`
--

DROP TABLE IF EXISTS `tb_attached_photo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_attached_photo` (
  `attached_photo_id` varchar(36) NOT NULL COMMENT 'review attached photo id',
  `review_id` varchar(36) NOT NULL COMMENT 'review id',
  `is_del` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'is delete',
  `update_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'update date',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`attached_photo_id`),
  KEY `idx_tb_attached_photo_01` (`review_id`),
  KEY `idx_tb_attached_photo_02` (`is_del`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='review attached photo table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_attached_photo`
--

LOCK TABLES `tb_attached_photo` WRITE;
/*!40000 ALTER TABLE `tb_attached_photo` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_attached_photo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_place`
--

DROP TABLE IF EXISTS `tb_place`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_place` (
  `place_id` varchar(36) NOT NULL COMMENT 'place id',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`place_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='place table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_place`
--

LOCK TABLES `tb_place` WRITE;
/*!40000 ALTER TABLE `tb_place` DISABLE KEYS */;
INSERT INTO `tb_place` VALUES ('2e4baf1c-5acb-4efb-a1af-eddada31b00f','2022-07-02 12:14:56');
/*!40000 ALTER TABLE `tb_place` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_review`
--

DROP TABLE IF EXISTS `tb_review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_review` (
  `review_id` varchar(36) NOT NULL COMMENT 'review id',
  `user_id` varchar(36) NOT NULL COMMENT 'user id',
  `place_id` varchar(36) NOT NULL COMMENT 'place_id',
  `content` varchar(500) NOT NULL DEFAULT '' COMMENT 'content',
  `is_del` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'is delete',
  `update_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00' COMMENT 'update date',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`review_id`),
  KEY `idx_tb_review_01` (`user_id`),
  KEY `idx_tb_review_02` (`place_id`),
  KEY `idx_tb_review_03` (`is_del`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='review table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_review`
--

LOCK TABLES `tb_review` WRITE;
/*!40000 ALTER TABLE `tb_review` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_review_point_dtl`
--

DROP TABLE IF EXISTS `tb_review_point_dtl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_review_point_dtl` (
  `review_point_dtl_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'point detail id',
  `review_point_mst_id` bigint unsigned NOT NULL COMMENT 'point master id',
  `review_id` varchar(36) NOT NULL COMMENT 'review id',
  `point_type` tinyint unsigned NOT NULL COMMENT '0: default, 1: text_point 2: photo_point, 3: place_first_review_point',
  `point_amt` bigint NOT NULL DEFAULT '0' COMMENT 'point amount',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`review_point_dtl_id`),
  KEY `idx_tb_review_point_dtl_01` (`review_point_mst_id`),
  KEY `idx_tb_review_point_dtl_02` (`review_id`),
  KEY `idx_tb_review_point_dtl_03` (`point_type`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb3 COMMENT='review point detail table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_review_point_dtl`
--

LOCK TABLES `tb_review_point_dtl` WRITE;
/*!40000 ALTER TABLE `tb_review_point_dtl` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_review_point_dtl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_review_point_mst`
--

DROP TABLE IF EXISTS `tb_review_point_mst`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_review_point_mst` (
  `review_point_mst_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'point master id',
  `user_id` varchar(36) NOT NULL COMMENT 'user id',
  `total_point_amt` bigint unsigned NOT NULL DEFAULT '0' COMMENT 'total point amount',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`review_point_mst_id`),
  KEY `idx_tb_review_point_mst_01` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 COMMENT='review point master table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_review_point_mst`
--

LOCK TABLES `tb_review_point_mst` WRITE;
/*!40000 ALTER TABLE `tb_review_point_mst` DISABLE KEYS */;
/*!40000 ALTER TABLE `tb_review_point_mst` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tb_user`
--

DROP TABLE IF EXISTS `tb_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_user` (
  `user_id` varchar(36) NOT NULL COMMENT 'user id',
  `reg_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'registration date',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='user table';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tb_user`
--

LOCK TABLES `tb_user` WRITE;
/*!40000 ALTER TABLE `tb_user` DISABLE KEYS */;
INSERT INTO `tb_user` VALUES ('3ede0ef2-92b7-4817-a5f3-0c575361f745','2022-07-02 12:14:38');
/*!40000 ALTER TABLE `tb_user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-07-02 12:16:58
