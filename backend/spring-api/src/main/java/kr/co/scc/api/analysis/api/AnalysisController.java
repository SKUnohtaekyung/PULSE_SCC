package kr.co.scc.api.analysis.api;

import java.util.UUID;

import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import kr.co.scc.api.analysis.application.AnalysisService;
import kr.co.scc.api.analysis.domain.AnalysisContracts.CreateJobCommand;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobCreated;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AnalysisController {

    private final AnalysisService service;

    public AnalysisController(AnalysisService service) {
        this.service = service;
    }

    @PostMapping("/analysis-jobs")
    public ResponseEntity<JobCreated> create(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateJobRequest request) {
        JobCreated created = service.create(
                userId(jwt),
                idempotencyKey,
                new CreateJobCommand(request.storeName(), request.category(), request.naverPlaceUrl()));
        // 여기서 바로 실행하지 않는다. 작업은 QUEUED 로 남고 AnalysisJobQueue 가 집어간다.
        // 요청 스레드에서 시작해 버리면 서버가 재시작될 때 그 작업을 되살릴 방법이 없다.
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(created);
    }

    @GetMapping("/analysis-jobs/{jobId}")
    public JobStatus status(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID jobId) {
        return service.status(userId(jwt), jobId);
    }

    @GetMapping("/analysis-jobs/{jobId}/result")
    public JsonNode result(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID jobId) {
        return service.result(userId(jwt), jobId);
    }

    @GetMapping("/me/saved-analysis")
    public JsonNode savedAnalysis(@AuthenticationPrincipal Jwt jwt) {
        return service.savedResult(userId(jwt));
    }

    @PutMapping("/me/saved-analysis/{analysisId}")
    public AnalysisService.SavedAnalysis replaceSavedAnalysis(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID analysisId) {
        return service.replaceSavedResult(userId(jwt), analysisId);
    }

    @GetMapping("/analyses/{analysisId}/evidence")
    public AnalysisService.EvidencePage evidence(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID analysisId,
            @RequestParam UUID personaId,
            @RequestParam String perspective,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        return service.evidence(
                userId(jwt), analysisId, personaId, perspective, cursor, limit);
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    public record CreateJobRequest(
            @NotBlank String storeName,
            @NotBlank String category,
            @NotBlank String naverPlaceUrl) {
    }
}
