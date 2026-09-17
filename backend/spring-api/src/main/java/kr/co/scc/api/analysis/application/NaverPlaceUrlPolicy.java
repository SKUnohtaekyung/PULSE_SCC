package kr.co.scc.api.analysis.application;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Set;

import org.springframework.http.HttpStatus;

public final class NaverPlaceUrlPolicy {

    private static final Set<String> ALLOWED_HOSTS = Set.of("map.naver.com", "m.place.naver.com");

    private NaverPlaceUrlPolicy() {
    }

    public static String validate(String value) {
        try {
            URI uri = new URI(value.trim()).normalize();
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getHost() == null
                    || !ALLOWED_HOSTS.contains(uri.getHost().toLowerCase())
                    || uri.getUserInfo() != null) {
                throw invalid();
            }
            return uri.toASCIIString();
        } catch (URISyntaxException | NullPointerException exception) {
            throw invalid();
        }
    }

    private static AnalysisException invalid() {
        return new AnalysisException(
                HttpStatus.BAD_REQUEST,
                "INVALID_NAVER_PLACE_URL",
                "지원하는 네이버 지도 HTTPS 주소를 입력해 주세요.",
                false);
    }
}
