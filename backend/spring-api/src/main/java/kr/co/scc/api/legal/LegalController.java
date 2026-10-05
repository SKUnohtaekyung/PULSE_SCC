package kr.co.scc.api.legal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/legal-documents")
public class LegalController {

    @GetMapping
    public LegalDocumentVersions current() {
        return new LegalDocumentVersions(
                LegalDocuments.TERMS_VERSION,
                LegalDocuments.PRIVACY_VERSION,
                false);
    }

    public record LegalDocumentVersions(
            String termsVersion,
            String privacyVersion,
            boolean legallyReviewed) {
    }
}
