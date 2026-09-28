package kr.co.scc.api.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class LoginAttemptLimiterTests {

    private static final String EMAIL = "owner@example.com";
    private static final String ADDRESS = "203.0.113.10";

    private MutableClock clock;
    private LoginAttemptLimiter limiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-09-28T00:00:00Z"));
        limiter = new LoginAttemptLimiter(clock);
    }

    // ---------- 계정 ----------

    @Test
    void tenAttemptsAreLetThrough() {
        attempt(9);

        assertThatCode(() -> limiter.reserveAttempt(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    void afterTenFailedAttemptsTheEmailIsLockedForFifteenMinutes() {
        attempt(10);

        AuthException locked = catchLimit(() -> limiter.reserveAttempt(EMAIL));
        assertThat(locked.status()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(locked.code()).isEqualTo("TOO_MANY_ATTEMPTS");
        assertThat(locked.retryAfter()).isEqualTo(Duration.ofMinutes(15));

        clock.advance(Duration.ofMinutes(15).minusSeconds(1));
        assertThatThrownBy(() -> limiter.reserveAttempt(EMAIL)).isInstanceOf(AuthException.class);

        clock.advance(Duration.ofSeconds(1));
        assertThatCode(() -> limiter.reserveAttempt(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    void attemptsStartOverAfterTheLockEnds() {
        attempt(10);
        clock.advance(Duration.ofMinutes(15));

        attempt(10);
    }

    @Test
    void attemptsOlderThanTheWindowAreForgotten() {
        attempt(9);
        clock.advance(Duration.ofMinutes(15));

        attempt(10);
    }

    @Test
    void aSuccessfulLoginClearsTheCount() {
        attempt(9);
        limiter.recordSuccess(EMAIL);

        attempt(10);
    }

    @Test
    void aSuccessOnTheTenthAttemptLiftsTheLock() {
        attempt(10);
        limiter.recordSuccess(EMAIL);

        assertThatCode(() -> limiter.reserveAttempt(EMAIL)).doesNotThrowAnyException();
    }

    @Test
    void oneAccountsAttemptsDoNotLockAnother() {
        attempt(10);

        assertThatCode(() -> limiter.reserveAttempt("other@example.com")).doesNotThrowAnyException();
    }

    // ---------- 주소 ----------

    @Test
    void sixtyRequestsInTenMinutesArePassedAndTheNextIsBlocked() {
        request(ADDRESS, 60);

        AuthException blocked = catchLimit(() -> limiter.checkRequest(ADDRESS));
        assertThat(blocked.retryAfter()).isEqualTo(Duration.ofMinutes(10));
        assertThatCode(() -> limiter.checkRequest("203.0.113.11")).doesNotThrowAnyException();
    }

    @Test
    void aBlockedAddressIsLetThroughAgainAfterTenMinutes() {
        request(ADDRESS, 60);
        catchLimit(() -> limiter.checkRequest(ADDRESS));

        clock.advance(Duration.ofMinutes(10).minusSeconds(1));
        assertThatThrownBy(() -> limiter.checkRequest(ADDRESS)).isInstanceOf(AuthException.class);

        clock.advance(Duration.ofSeconds(1));
        assertThatCode(() -> limiter.checkRequest(ADDRESS)).doesNotThrowAnyException();
    }

    @Test
    void theRequestCountStartsOverInTheNextWindow() {
        request(ADDRESS, 60);
        clock.advance(Duration.ofMinutes(10));

        request(ADDRESS, 60);
    }

    @Test
    void ipv6AddressesInOneSlash64ShareALimit() {
        request("2001:db8:1:2::1", 30);
        request("2001:db8:1:2:ffff:ffff:ffff:9", 30);

        assertThatThrownBy(() -> limiter.checkRequest("2001:db8:1:2::abcd")).isInstanceOf(AuthException.class);
        assertThatCode(() -> limiter.checkRequest("2001:db8:1:3::1")).doesNotThrowAnyException();
    }

    @Test
    void addressKeysGroupIpv6ByPrefixAndLeaveIpv4Alone() {
        assertThat(LoginAttemptLimiter.addressKey("2001:db8:1:2::1"))
                .isEqualTo(LoginAttemptLimiter.addressKey("2001:DB8:1:2:0:0:0:ffff"))
                .isEqualTo("20010db800010002::/64");
        assertThat(LoginAttemptLimiter.addressKey("203.0.113.7")).isEqualTo("203.0.113.7");
        assertThat(LoginAttemptLimiter.addressKey("::ffff:203.0.113.7")).isEqualTo("203.0.113.7");
    }

    @Test
    void aValueThatIsNotAnIpLiteralIsUsedAsItIsWithoutAnyLookup() {
        assertThat(LoginAttemptLimiter.addressKey("zz:80")).isEqualTo("zz:80");
        assertThat(LoginAttemptLimiter.addressKey("g::1")).isEqualTo("g::1");
    }

    // ---------- 상한 ----------

    @Test
    void newKeysAreBlockedWhileTheTrackerIsFullOfLiveRecords() {
        LoginAttemptLimiter small = new LoginAttemptLimiter(clock, 2);
        small.checkRequest("203.0.113.1");
        small.checkRequest("203.0.113.2");

        assertThat(catchLimitOn(() -> small.checkRequest("203.0.113.3")).code()).isEqualTo("TOO_MANY_ATTEMPTS");
        assertThatCode(() -> small.checkRequest("203.0.113.1")).doesNotThrowAnyException();

        clock.advance(Duration.ofMinutes(10));
        assertThatCode(() -> small.checkRequest("203.0.113.3")).doesNotThrowAnyException();
    }

    private void attempt(int times) {
        for (int i = 0; i < times; i++) {
            limiter.reserveAttempt(EMAIL);
        }
    }

    private void request(String address, int times) {
        for (int i = 0; i < times; i++) {
            limiter.checkRequest(address);
        }
    }

    private AuthException catchLimit(Runnable call) {
        return catchLimitOn(call);
    }

    private static AuthException catchLimitOn(Runnable call) {
        try {
            call.run();
        } catch (AuthException exception) {
            return exception;
        }
        throw new AssertionError("요청이 막히지 않았다");
    }

    private static final class MutableClock extends Clock {

        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
