CREATE TABLE analysis_result_documents (
    analysis_id uuid PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_result_documents_analysis
        FOREIGN KEY (analysis_id) REFERENCES analyses (id),
    CONSTRAINT ck_analysis_result_documents_payload_object
        CHECK (jsonb_typeof(payload) = 'object')
);

CREATE TABLE legal_consents (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    document_type varchar(32) NOT NULL,
    document_version varchar(32) NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_legal_consents_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT uq_legal_consents_user_document_version
        UNIQUE (user_id, document_type, document_version),
    CONSTRAINT ck_legal_consents_document_type
        CHECK (document_type IN ('TERMS_OF_SERVICE', 'PRIVACY_POLICY'))
);

CREATE INDEX ix_legal_consents_user_accepted
    ON legal_consents (user_id, accepted_at DESC);
