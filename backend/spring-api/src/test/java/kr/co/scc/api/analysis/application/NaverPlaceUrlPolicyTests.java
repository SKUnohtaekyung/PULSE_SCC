package kr.co.scc.api.analysis.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class NaverPlaceUrlPolicyTests {

    @Test
    void acceptsOnlySupportedHttpsHosts() {
        assertThat(NaverPlaceUrlPolicy.validate(" https://map.naver.com/p/entry/place/123?c=1 "))
                .isEqualTo("https://map.naver.com/p/entry/place/123?c=1");
        assertThat(NaverPlaceUrlPolicy.validate("https://m.place.naver.com/restaurant/123/home"))
                .isEqualTo("https://m.place.naver.com/restaurant/123/home");
    }

    @Test
    void rejectsHttpLookalikeAndUserInfoUrls() {
        assertThatThrownBy(() -> NaverPlaceUrlPolicy.validate("http://map.naver.com/123"))
                .isInstanceOf(AnalysisException.class);
        assertThatThrownBy(() -> NaverPlaceUrlPolicy.validate("https://map.naver.com.evil.example/123"))
                .isInstanceOf(AnalysisException.class);
        assertThatThrownBy(() -> NaverPlaceUrlPolicy.validate("https://user@map.naver.com/123"))
                .isInstanceOf(AnalysisException.class);
    }
}
