package kr.co.scc.api.analysis.api;

import java.time.Duration;
import java.util.UUID;

import kr.co.scc.api.analysis.application.AnalysisException;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import kr.co.scc.api.analysis.infrastructure.PersonaImageStorage;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/persona-images")
public class PersonaImageController {

    private final AnalysisRepository repository;
    private final PersonaImageStorage storage;

    public PersonaImageController(AnalysisRepository repository, PersonaImageStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    @GetMapping(value = "/{imageId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<Resource> image(
            @AuthenticationPrincipal Jwt jwt, @PathVariable UUID imageId) {
        UUID userId = UUID.fromString(jwt.getSubject());
        AnalysisRepository.ImageRecord image = repository.findImage(imageId, userId)
                .orElseThrow(() -> new AnalysisException(
                        org.springframework.http.HttpStatus.NOT_FOUND,
                        "IMAGE_NOT_FOUND",
                        "페르소나 이미지를 찾을 수 없습니다.",
                        false));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePrivate())
                .body(storage.load(image.storageKey()));
    }
}
