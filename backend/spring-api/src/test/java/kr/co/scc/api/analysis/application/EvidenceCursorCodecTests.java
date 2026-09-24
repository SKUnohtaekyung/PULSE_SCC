package kr.co.scc.api.analysis.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class EvidenceCursorCodecTests {

    @Test
    void roundTripsWithoutExposingThePlainCursorValue() {
        EvidenceCursorCodec.Cursor cursor = new EvidenceCursorCodec.Cursor(3, UUID.randomUUID());

        String encoded = EvidenceCursorCodec.encode(cursor);

        assertThat(encoded).doesNotContain(":");
        assertThat(EvidenceCursorCodec.decode(encoded)).isEqualTo(cursor);
    }

    @Test
    void rejectsMalformedAndNegativeCursors() {
        assertThatThrownBy(() -> EvidenceCursorCodec.decode("not-a-cursor"))
                .isInstanceOf(AnalysisException.class);
        String negative = java.util.Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(("-1:" + UUID.randomUUID()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertThatThrownBy(() -> EvidenceCursorCodec.decode(negative))
                .isInstanceOf(AnalysisException.class);
    }
}
