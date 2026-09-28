package kr.co.scc.api.auth.application;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * 비밀번호 대입과 요청 폭주를 막는 시도 제한(#32, 2026-09-28 사용자 결정).
 *
 * <p>같은 이메일로 로그인에 10번 실패하면 15분 동안 그 이메일의 로그인을 막고, 같은 주소에서
 * 로그인·가입 요청이 10분에 60번을 넘으면 10분 동안 막는다. 존재하지 않는 이메일도 똑같이
 * 세므로 잠금 여부로 가입 여부가 드러나지 않는다.
 *
 * <p>로그인 시도는 비밀번호를 확인하기 전에 실패로 먼저 센다({@link #reserveAttempt}). 확인한 뒤에
 * 세면 동시에 보낸 요청이 모두 잠금 확인을 통과해 10번보다 많이 비밀번호를 확인하게 된다.
 * 성공하면 {@link #recordSuccess} 가 기록을 지운다.
 *
 * <p>상태는 이 인스턴스의 메모리에만 있다. 재시작하면 초기화되고, 여러 인스턴스는 각자 센다.
 * DB 에 두면 migration 번호가 진행 중인 다른 브랜치와 겹쳐 MVP 에서는 메모리로 둔다.
 * 기록 수에는 상한이 있고, 꽉 차면 새 이메일·주소의 요청을 막는다(메모리 고갈보다 일시 차단이 낫다).
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_ACCOUNT_FAILURES = 10;
    static final Duration ACCOUNT_LOCK = Duration.ofMinutes(15);
    static final int MAX_REQUESTS_PER_ADDRESS = 60;
    static final Duration ADDRESS_WINDOW = Duration.ofMinutes(10);
    static final Duration ADDRESS_BLOCK = Duration.ofMinutes(10);
    /** 계정·주소 기록 각각의 최대 개수. 넘치면 기한 지난 기록을 치우고, 그래도 차 있으면 막는다. */
    static final int MAX_TRACKED = 100_000;
    /** 기한 지난 기록을 치우는 최소 간격. 요청마다 전체를 훑지 않는다. */
    static final Duration PURGE_INTERVAL = Duration.ofSeconds(30);
    /** IPv6 는 한 사용자가 /64 하나를 통째로 받으므로 앞 8바이트로 묶어 센다. */
    private static final int IPV6_PREFIX_BYTES = 8;
    private static final Pattern IPV6_LITERAL = Pattern.compile("\\[?[0-9A-Fa-f:.]+(%[0-9A-Za-z._-]+)?]?");

    private final Tracker accounts;
    private final Tracker addresses;
    private final Clock clock;

    @Autowired
    public LoginAttemptLimiter(Clock clock) {
        this(clock, MAX_TRACKED);
    }

    LoginAttemptLimiter(Clock clock, int maxTracked) {
        this.clock = clock;
        this.accounts = new Tracker(ACCOUNT_LOCK, maxTracked);
        this.addresses = new Tracker(ADDRESS_WINDOW, maxTracked);
    }

    /** 로그인·가입 요청 하나를 센다. 한도를 넘었으면 막는다. */
    public void checkRequest(String clientAddress) {
        Instant now = clock.instant();
        addresses.admit(addressKey(clientAddress), now, MAX_REQUESTS_PER_ADDRESS, ADDRESS_BLOCK, false);
    }

    /**
     * 비밀번호를 확인하기 전에 호출한다. 잠겨 있으면 막고, 아니면 이 시도를 실패로 먼저 센다.
     * 10번째 시도까지는 통과하고, 그 뒤로는 기한까지 막는다.
     */
    public void reserveAttempt(String normalizedEmail) {
        Instant now = clock.instant();
        accounts.admit(normalizedEmail, now, MAX_ACCOUNT_FAILURES, ACCOUNT_LOCK, true);
    }

    public void recordSuccess(String normalizedEmail) {
        accounts.states.remove(normalizedEmail);
    }

    static String addressKey(String clientAddress) {
        if (clientAddress == null || clientAddress.indexOf(':') < 0) {
            return String.valueOf(clientAddress);
        }
        // IP 리터럴에 쓰이는 문자만 있을 때만 해석한다. 그 밖의 문자열을 getByName 에 넘기면
        // 이름 조회가 일어날 수 있다(나중에 전달 헤더 값이 remoteAddr 로 들어오는 경우).
        if (!IPV6_LITERAL.matcher(clientAddress).matches()) {
            return clientAddress;
        }
        try {
            // IPv4 매핑 주소는 Inet4Address 로 온다.
            InetAddress parsed = InetAddress.getByName(clientAddress);
            if (parsed instanceof Inet6Address) {
                byte[] bytes = parsed.getAddress();
                return HexFormat.of().formatHex(bytes, 0, IPV6_PREFIX_BYTES) + "::/64";
            }
            return parsed.getHostAddress();
        } catch (UnknownHostException exception) {
            return clientAddress;
        }
    }

    private static AuthException tooManyAttempts(Instant now, Instant blockedUntil) {
        return new AuthException(
                HttpStatus.TOO_MANY_REQUESTS,
                "TOO_MANY_ATTEMPTS",
                "시도가 너무 많습니다. 잠시 뒤에 다시 시도해 주세요.",
                Duration.between(now, blockedUntil));
    }

    /** 키별 창과 상한 관리. */
    private static final class Tracker {

        private final ConcurrentHashMap<String, Window> states = new ConcurrentHashMap<>();
        private final Duration window;
        private final int maxTracked;
        private volatile Instant lastPurge = Instant.EPOCH;

        Tracker(Duration window, int maxTracked) {
            this.window = window;
            this.maxTracked = maxTracked;
        }

        /**
         * 시도 하나를 센다. {@code allowed} 번째까지는 통과하고 그 다음부터 막는다.
         * {@code blockOnLimit} 이면 {@code allowed} 번째 시도가 통과하는 순간 기한을 찍는다
         * (그 시도 자체는 통과). 아니면 {@code allowed} 를 넘는 시도에서 기한을 찍고 막는다.
         */
        void admit(String key, Instant now, int allowed, Duration block, boolean blockOnLimit) {
            if (!states.containsKey(key) && states.size() >= maxTracked) {
                purge(now);
                if (states.size() >= maxTracked) {
                    throw tooManyAttempts(now, now.plus(block));
                }
            }
            AtomicReference<Instant> rejectedUntil = new AtomicReference<>();
            states.compute(key, (ignored, current) -> {
                Window state = current == null || current.expired(now, window) ? Window.start(now) : current;
                Instant blockedUntil = state.blockedUntil(now);
                if (blockedUntil != null) {
                    rejectedUntil.set(blockedUntil);
                    return state;
                }
                int next = state.attempts() + 1;
                if (!blockOnLimit && next > allowed) {
                    Instant until = now.plus(block);
                    rejectedUntil.set(until);
                    return new Window(state.startedAt(), next, until);
                }
                Instant until = blockOnLimit && next >= allowed ? now.plus(block) : null;
                return new Window(state.startedAt(), next, until);
            });
            if (rejectedUntil.get() != null) {
                throw tooManyAttempts(now, rejectedUntil.get());
            }
        }

        private void purge(Instant now) {
            if (now.isBefore(lastPurge.plus(PURGE_INTERVAL))) {
                return;
            }
            lastPurge = now;
            states.values().removeIf(state -> state.expired(now, window));
        }
    }

    /**
     * 창이 시작된 뒤의 횟수와 막힌 기한. 기한이 지나면 창도 끝난 것으로 보고 처음부터 다시 센다.
     */
    private record Window(Instant startedAt, int attempts, Instant blockedUntil) {

        static Window start(Instant now) {
            return new Window(now, 0, null);
        }

        Instant blockedUntil(Instant now) {
            return blockedUntil != null && now.isBefore(blockedUntil) ? blockedUntil : null;
        }

        boolean expired(Instant now, Duration window) {
            if (blockedUntil != null) {
                return !now.isBefore(blockedUntil);
            }
            return !now.isBefore(startedAt.plus(window));
        }
    }
}
