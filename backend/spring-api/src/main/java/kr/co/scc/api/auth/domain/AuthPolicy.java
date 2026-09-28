package kr.co.scc.api.auth.domain;

import java.util.Locale;
import java.nio.charset.StandardCharsets;

public final class AuthPolicy {

    public static final int MINIMUM_PASSWORD_LENGTH = 8;
    public static final int MAXIMUM_PASSWORD_BYTES = 72;

    private AuthPolicy() {
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizePhoneNumber(String phoneNumber) {
        String trimmed = phoneNumber.trim();
        boolean international = trimmed.startsWith("+");
        String digits = trimmed.replaceAll("[^0-9]", "");
        if (digits.length() < 8 || digits.length() > 15) {
            throw new IllegalArgumentException("전화번호는 국가번호를 포함해 숫자 8~15자리여야 합니다.");
        }
        return international ? "+" + digits : digits;
    }

    public static void validatePassword(String password) {
        int length = password.codePointCount(0, password.length());
        if (length < MINIMUM_PASSWORD_LENGTH
                || password.getBytes(StandardCharsets.UTF_8).length > MAXIMUM_PASSWORD_BYTES) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이며 UTF-8 기준 72바이트 이하여야 합니다.");
        }
    }
}
