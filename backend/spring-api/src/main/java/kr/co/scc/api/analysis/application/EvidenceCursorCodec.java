package kr.co.scc.api.analysis.application;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;

import org.springframework.http.HttpStatus;

public final class EvidenceCursorCodec {

    private EvidenceCursorCodec() {
    }

    public static String encode(Cursor cursor) {
        String value = cursor.sortOrder() + ":" + cursor.evidenceLinkId();
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    public static Cursor decode(String encoded) {
        try {
            String value = new String(
                    Base64.getUrlDecoder().decode(encoded), StandardCharsets.UTF_8);
            int separator = value.indexOf(':');
            if (separator <= 0 || separator == value.length() - 1) {
                throw invalidCursor();
            }
            int sortOrder = Integer.parseInt(value.substring(0, separator));
            if (sortOrder < 0) {
                throw invalidCursor();
            }
            return new Cursor(sortOrder, UUID.fromString(value.substring(separator + 1)));
        } catch (IllegalArgumentException exception) {
            throw invalidCursor();
        }
    }

    private static AnalysisException invalidCursor() {
        return new AnalysisException(
                HttpStatus.BAD_REQUEST,
                "INVALID_EVIDENCE_CURSOR",
                "근거 리뷰 목록의 위치 정보가 올바르지 않습니다.",
                false);
    }

    public record Cursor(int sortOrder, UUID evidenceLinkId) {
    }
}
