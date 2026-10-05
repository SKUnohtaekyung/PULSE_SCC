-- 유효 리뷰가 기준보다 적어 실패한 작업의 현재 유효 리뷰 수(기능명세 REVIEW-008, #36 리뷰).
--
-- 앱은 '현재 N건 / 기준 50건'을 보여 줘야 한다. 실패한 작업은 analyses 행이 없으므로
-- 작업에 건수를 남긴다. 다른 실패에서는 비어 있다.

ALTER TABLE analysis_jobs
    ADD COLUMN valid_review_count integer,
    ADD CONSTRAINT ck_analysis_jobs_valid_review_count
        CHECK (valid_review_count IS NULL OR valid_review_count >= 0);
