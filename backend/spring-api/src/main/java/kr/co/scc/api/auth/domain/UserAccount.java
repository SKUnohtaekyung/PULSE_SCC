package kr.co.scc.api.auth.domain;

import java.util.UUID;

public record UserAccount(
        UUID id,
        String email,
        String credentialHash,
        String phoneNumber,
        String status) {

    public boolean active() {
        return "ACTIVE".equals(status);
    }
}
