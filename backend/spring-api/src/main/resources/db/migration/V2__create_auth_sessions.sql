CREATE TABLE auth_sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    refresh_token_hash varchar(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    replaced_by_session_id uuid,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_auth_sessions_replacement
        FOREIGN KEY (replaced_by_session_id) REFERENCES auth_sessions (id),
    CONSTRAINT uq_auth_sessions_refresh_token_hash
        UNIQUE (refresh_token_hash),
    CONSTRAINT ck_auth_sessions_expiry
        CHECK (expires_at > created_at),
    CONSTRAINT ck_auth_sessions_replacement
        CHECK (replaced_by_session_id IS NULL OR revoked_at IS NOT NULL)
);

CREATE INDEX idx_auth_sessions_user_active
    ON auth_sessions (user_id, expires_at)
    WHERE revoked_at IS NULL;
