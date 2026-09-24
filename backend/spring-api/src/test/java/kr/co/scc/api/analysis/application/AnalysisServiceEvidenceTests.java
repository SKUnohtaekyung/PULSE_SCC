package kr.co.scc.api.analysis.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AnalysisServiceEvidenceTests {

    private AnalysisRepository repository;
    private AnalysisService service;
    private UUID userId;
    private UUID analysisId;
    private UUID personaId;

    @BeforeEach
    void setUp() {
        repository = mock(AnalysisRepository.class);
        service = new AnalysisService(repository, mock(AnalysisJobRunner.class));
        userId = UUID.randomUUID();
        analysisId = UUID.randomUUID();
        personaId = UUID.randomUUID();
        when(repository.ownsPersona(userId, analysisId, personaId)).thenReturn(true);
    }

    @Test
    void returnsAnOpaqueNextCursorAndOnlyTheRequestedPage() {
        AnalysisRepository.EvidenceRecord first = record(0);
        AnalysisRepository.EvidenceRecord second = record(1);
        when(repository.findEvidence(eq(analysisId), eq(personaId), eq("POSITIVE"), eq(null), eq(2)))
                .thenReturn(List.of(first, second));

        AnalysisService.EvidencePage page =
                service.evidence(userId, analysisId, personaId, "POSITIVE", null, 1);

        assertThat(page.items()).hasSize(1);
        assertThat(page.items().getFirst().reviewId()).isEqualTo(first.reviewId());
        assertThat(page.nextCursor()).isNotBlank().doesNotContain(":");
        assertThat(EvidenceCursorCodec.decode(page.nextCursor()))
                .isEqualTo(new EvidenceCursorCodec.Cursor(
                        first.sortOrder(), first.evidenceLinkId()));
    }

    @Test
    void rejectsUnknownPerspectivesAndLimitsAboveTheCollectionCeiling() {
        assertThatThrownBy(() ->
                        service.evidence(userId, analysisId, personaId, "UNKNOWN", null, 20))
                .isInstanceOf(AnalysisException.class)
                .extracting("code")
                .isEqualTo("INVALID_EVIDENCE_REQUEST");
        assertThatThrownBy(() ->
                        service.evidence(userId, analysisId, personaId, "POSITIVE", null, 121))
                .isInstanceOf(AnalysisException.class)
                .extracting("code")
                .isEqualTo("INVALID_EVIDENCE_REQUEST");
    }

    @Test
    void hidesWhetherAnotherUsersPersonaExists() {
        when(repository.ownsPersona(userId, analysisId, personaId)).thenReturn(false);

        assertThatThrownBy(() ->
                        service.evidence(userId, analysisId, personaId, "POSITIVE", null, 20))
                .isInstanceOf(AnalysisException.class)
                .extracting("code")
                .isEqualTo("ANALYSIS_NOT_FOUND");
    }

    private static AnalysisRepository.EvidenceRecord record(int sortOrder) {
        return new AnalysisRepository.EvidenceRecord(
                UUID.randomUUID(),
                sortOrder,
                UUID.randomUUID(),
                "근거 리뷰",
                BigDecimal.valueOf(5),
                LocalDate.of(2026, 9, 24),
                "NAVER");
    }
}
