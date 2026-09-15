CREATE TABLE users (
    id uuid PRIMARY KEY,
    login_email varchar(320) NOT NULL,
    credential_hash varchar(255),
    phone_number varchar(32),
    status varchar(32) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_login_email UNIQUE (login_email)
);

CREATE TABLE user_identities (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    provider varchar(32) NOT NULL,
    provider_subject varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_identities_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_user_identities_provider_subject
        UNIQUE (provider, provider_subject),
    CONSTRAINT ck_user_identities_provider
        CHECK (provider IN ('LOCAL', 'GOOGLE'))
);

CREATE TABLE stores (
    id uuid PRIMARY KEY,
    name varchar(255) NOT NULL,
    category varchar(32) NOT NULL,
    naver_place_url text NOT NULL,
    naver_place_id varchar(128),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_stores_category
        CHECK (category IN ('한식', '중식', '일식', '양식', '카페/디저트', '주점', '기타'))
);

CREATE TABLE analysis_jobs (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    store_id uuid NOT NULL,
    idempotency_key varchar(255) NOT NULL,
    request_hash varchar(128) NOT NULL,
    status varchar(32) NOT NULL,
    progress_step varchar(32) NOT NULL,
    message_code varchar(64),
    error_code varchar(64),
    retryable boolean NOT NULL DEFAULT false,
    attempt_count integer NOT NULL DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_jobs_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_analysis_jobs_store
        FOREIGN KEY (store_id) REFERENCES stores (id),
    CONSTRAINT uq_analysis_jobs_user_idempotency
        UNIQUE (user_id, idempotency_key),
    CONSTRAINT uq_analysis_jobs_id_user
        UNIQUE (id, user_id),
    CONSTRAINT uq_analysis_jobs_id_user_store
        UNIQUE (id, user_id, store_id),
    CONSTRAINT ck_analysis_jobs_status
        CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
    CONSTRAINT ck_analysis_jobs_progress_step
        CHECK (progress_step IN (
            'QUEUED',
            'RESOLVING_STORE',
            'COLLECTING_REVIEWS',
            'PREPROCESSING',
            'ANALYZING',
            'RETRIEVING_KNOWLEDGE',
            'GENERATING_ADVICE',
            'GENERATING_IMAGE',
            'VALIDATING_RESULT',
            'COMPLETED',
            'FAILED'
        )),
    CONSTRAINT ck_analysis_jobs_attempt_count
        CHECK (attempt_count >= 0),
    CONSTRAINT ck_analysis_jobs_completion_time
        CHECK (
            (status IN ('COMPLETED', 'FAILED') AND completed_at IS NOT NULL)
            OR (status IN ('QUEUED', 'RUNNING') AND completed_at IS NULL)
        )
);

CREATE TABLE analyses (
    id uuid PRIMARY KEY,
    job_id uuid NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid NOT NULL,
    collected_review_count integer NOT NULL,
    valid_review_count integer NOT NULL,
    contains_old_reviews boolean NOT NULL DEFAULT false,
    schema_version varchar(32) NOT NULL,
    model_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
    limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
    collected_at timestamptz NOT NULL,
    analyzed_at timestamptz NOT NULL,
    CONSTRAINT uq_analyses_job UNIQUE (job_id),
    CONSTRAINT uq_analyses_id_job UNIQUE (id, job_id),
    CONSTRAINT uq_analyses_id_user UNIQUE (id, user_id),
    CONSTRAINT fk_analyses_job_owner
        FOREIGN KEY (job_id, user_id, store_id)
        REFERENCES analysis_jobs (id, user_id, store_id),
    CONSTRAINT ck_analyses_review_counts
        CHECK (
            valid_review_count >= 50
            AND collected_review_count >= valid_review_count
        ),
    CONSTRAINT ck_analyses_model_versions_object
        CHECK (jsonb_typeof(model_versions) = 'object'),
    CONSTRAINT ck_analyses_limitations_array
        CHECK (jsonb_typeof(limitations) = 'array')
);

CREATE TABLE reviews (
    id uuid PRIMARY KEY,
    job_id uuid NOT NULL,
    analysis_id uuid,
    platform varchar(32) NOT NULL,
    content text NOT NULL,
    normalized_content text NOT NULL,
    rating numeric,
    written_at date,
    collected_at timestamptz NOT NULL,
    content_hash varchar(128) NOT NULL,
    source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_reviews_job
        FOREIGN KEY (job_id) REFERENCES analysis_jobs (id),
    CONSTRAINT fk_reviews_analysis_job
        FOREIGN KEY (analysis_id, job_id) REFERENCES analyses (id, job_id),
    CONSTRAINT uq_reviews_job_content_hash UNIQUE (job_id, content_hash),
    CONSTRAINT uq_reviews_id_analysis UNIQUE (id, analysis_id),
    CONSTRAINT ck_reviews_platform CHECK (platform = 'NAVER'),
    CONSTRAINT ck_reviews_source_metadata_object
        CHECK (jsonb_typeof(source_metadata) = 'object')
);

CREATE TABLE personas (
    id uuid PRIMARY KEY,
    analysis_id uuid NOT NULL,
    rank smallint NOT NULL,
    topic_review_count integer NOT NULL,
    label varchar(255) NOT NULL,
    summary text NOT NULL,
    caveat text NOT NULL,
    CONSTRAINT fk_personas_analysis
        FOREIGN KEY (analysis_id) REFERENCES analyses (id),
    CONSTRAINT uq_personas_analysis_rank UNIQUE (analysis_id, rank),
    CONSTRAINT uq_personas_id_analysis UNIQUE (id, analysis_id),
    CONSTRAINT ck_personas_rank CHECK (rank BETWEEN 1 AND 3),
    CONSTRAINT ck_personas_topic_review_count CHECK (topic_review_count > 0)
);

CREATE TABLE insights (
    id uuid PRIMARY KEY,
    persona_id uuid NOT NULL,
    analysis_id uuid NOT NULL,
    kind varchar(32) NOT NULL,
    review_fact text NOT NULL,
    ai_interpretation text,
    sort_order integer NOT NULL,
    CONSTRAINT fk_insights_persona_analysis
        FOREIGN KEY (persona_id, analysis_id) REFERENCES personas (id, analysis_id),
    CONSTRAINT uq_insights_id_analysis UNIQUE (id, analysis_id),
    CONSTRAINT ck_insights_kind
        CHECK (kind IN ('POSITIVE', 'NEGATIVE', 'PERCEPTION', 'PRIORITY')),
    CONSTRAINT ck_insights_sort_order CHECK (sort_order >= 0)
);

CREATE TABLE advice (
    id uuid PRIMARY KEY,
    persona_id uuid NOT NULL,
    analysis_id uuid NOT NULL,
    review_fact text NOT NULL,
    suggested_action text NOT NULL,
    ai_interpretation text,
    sort_order integer NOT NULL,
    CONSTRAINT fk_advice_persona_analysis
        FOREIGN KEY (persona_id, analysis_id) REFERENCES personas (id, analysis_id),
    CONSTRAINT uq_advice_id_analysis UNIQUE (id, analysis_id),
    CONSTRAINT ck_advice_sort_order CHECK (sort_order >= 0)
);

CREATE TABLE knowledge_references (
    id uuid PRIMARY KEY,
    advice_id uuid NOT NULL,
    source_id varchar(255) NOT NULL,
    title varchar(500) NOT NULL,
    locator text NOT NULL,
    retrieved_at timestamptz NOT NULL,
    CONSTRAINT fk_knowledge_references_advice
        FOREIGN KEY (advice_id) REFERENCES advice (id)
);

CREATE TABLE persona_images (
    id uuid PRIMARY KEY,
    persona_id uuid NOT NULL,
    storage_key text NOT NULL,
    alt_text text NOT NULL,
    style_version varchar(64) NOT NULL,
    model_version varchar(128) NOT NULL,
    status varchar(32) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_persona_images_persona
        FOREIGN KEY (persona_id) REFERENCES personas (id),
    CONSTRAINT uq_persona_images_persona UNIQUE (persona_id)
);

CREATE TABLE evidence_links (
    id uuid PRIMARY KEY,
    analysis_id uuid NOT NULL,
    review_id uuid NOT NULL,
    insight_id uuid,
    advice_id uuid,
    excerpt text NOT NULL,
    sort_order integer NOT NULL,
    CONSTRAINT fk_evidence_links_review_analysis
        FOREIGN KEY (review_id, analysis_id) REFERENCES reviews (id, analysis_id),
    CONSTRAINT fk_evidence_links_insight_analysis
        FOREIGN KEY (insight_id, analysis_id) REFERENCES insights (id, analysis_id),
    CONSTRAINT fk_evidence_links_advice_analysis
        FOREIGN KEY (advice_id, analysis_id) REFERENCES advice (id, analysis_id),
    CONSTRAINT ck_evidence_links_one_target
        CHECK (num_nonnulls(insight_id, advice_id) = 1),
    CONSTRAINT ck_evidence_links_sort_order CHECK (sort_order >= 0)
);

CREATE TABLE saved_analyses (
    user_id uuid PRIMARY KEY,
    analysis_id uuid NOT NULL,
    saved_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_analyses_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_saved_analyses_analysis_owner
        FOREIGN KEY (analysis_id, user_id) REFERENCES analyses (id, user_id),
    CONSTRAINT uq_saved_analyses_analysis UNIQUE (analysis_id)
);

CREATE TABLE notifications (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    job_id uuid NOT NULL,
    type varchar(32) NOT NULL,
    message_code varchar(64) NOT NULL,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_notifications_job_owner
        FOREIGN KEY (job_id, user_id) REFERENCES analysis_jobs (id, user_id),
    CONSTRAINT uq_notifications_job_type UNIQUE (job_id, type),
    CONSTRAINT ck_notifications_type
        CHECK (type IN ('ANALYSIS_COMPLETED', 'ANALYSIS_FAILED'))
);

CREATE TABLE notification_settings (
    user_id uuid PRIMARY KEY,
    analysis_result_enabled boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_settings_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX ix_analysis_jobs_user_created
    ON analysis_jobs (user_id, created_at DESC);

CREATE INDEX ix_analysis_jobs_status_updated
    ON analysis_jobs (status, updated_at);

CREATE INDEX ix_analyses_user_analyzed
    ON analyses (user_id, analyzed_at DESC);

CREATE INDEX ix_evidence_links_insight_sort
    ON evidence_links (insight_id, sort_order)
    WHERE insight_id IS NOT NULL;

CREATE INDEX ix_evidence_links_advice_sort
    ON evidence_links (advice_id, sort_order)
    WHERE advice_id IS NOT NULL;

CREATE INDEX ix_evidence_links_review
    ON evidence_links (review_id);

CREATE INDEX ix_notifications_user_created
    ON notifications (user_id, created_at DESC);
