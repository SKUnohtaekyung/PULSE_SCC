package kr.co.scc.api.auth.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AuthPolicyTests {

    @Test
    void normalizesEmailAndPhoneWithoutMakingPhoneUnique() {
        assertThat(AuthPolicy.normalizeEmail(" Owner@Example.COM ")).isEqualTo("owner@example.com");
        assertThat(AuthPolicy.normalizePhoneNumber("010-1234-5678")).isEqualTo("01012345678");
        assertThat(AuthPolicy.normalizePhoneNumber("+82 10 1234 5678")).isEqualTo("+821012345678");
    }

    @Test
    void acceptsEightCharacterPasswordAndRejectsShorterValue() {
        AuthPolicy.validatePassword("12345678");

        assertThatThrownBy(() -> AuthPolicy.validatePassword("1234567"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("8자 이상");
    }
}
