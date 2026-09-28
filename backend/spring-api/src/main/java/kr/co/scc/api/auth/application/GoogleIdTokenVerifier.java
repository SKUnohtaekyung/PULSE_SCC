package kr.co.scc.api.auth.application;

public interface GoogleIdTokenVerifier {

    GoogleIdentity verify(String idToken);
}
