package kr.co.scc.api.legal;

public final class LegalDocuments {

    public static final String TERMS_VERSION = "2026-09-17";
    public static final String PRIVACY_VERSION = "2026-09-17";

    private LegalDocuments() {
    }

    public static void requireCurrent(String termsVersion, String privacyVersion) {
        if (!TERMS_VERSION.equals(termsVersion) || !PRIVACY_VERSION.equals(privacyVersion)) {
            throw new IllegalArgumentException("CURRENT_LEGAL_CONSENT_REQUIRED");
        }
    }
}
