package kr.co.scc.api.analysis.infrastructure;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class PersonaImageStorage {

    private static final Logger log = LoggerFactory.getLogger(PersonaImageStorage.class);

    private final Path root;

    public PersonaImageStorage(AnalysisServiceProperties properties) {
        this.root = properties.imageStorageDirectory();
    }

    public String save(UUID analysisId, UUID imageId, String contentBase64) {
        try {
            Path directory = root.resolve(analysisId.toString()).normalize();
            requireInsideRoot(directory);
            Files.createDirectories(directory);
            Path target = directory.resolve(imageId + ".png").normalize();
            requireInsideRoot(target);
            Files.write(
                    target,
                    Base64.getDecoder().decode(contentBase64),
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE);
            String storageKey = root.relativize(target).toString().replace('\\', '/');
            removeIfRolledBack(storageKey);
            return storageKey;
        } catch (IOException | IllegalArgumentException exception) {
            throw new IllegalStateException("페르소나 이미지를 저장하지 못했습니다.", exception);
        }
    }

    public Resource load(String storageKey) {
        try {
            Path target = root.resolve(storageKey).normalize();
            requireInsideRoot(target);
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalStateException("이미지 파일을 찾을 수 없습니다.");
            }
            return resource;
        } catch (IOException exception) {
            throw new IllegalStateException("이미지 파일을 읽지 못했습니다.", exception);
        }
    }

    /**
     * 트랜잭션 안이면 커밋된 뒤에 지운다. 커밋 전에 지우면 커밋이 실패했을 때 DB 는 남고 파일만
     * 사라진다. 트랜잭션 밖이면 바로 지운다.
     */
    public void deleteAllAfterCommit(Collection<String> storageKeys) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteAll(storageKeys);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    deleteAll(storageKeys);
                } catch (RuntimeException exception) {
                    log.error("탈퇴 계정의 페르소나 이미지 파일을 지우지 못했습니다. 수동 정리가 필요합니다.", exception);
                }
            }
        });
    }

    /** 결과 저장 트랜잭션이 되돌려지면 방금 쓴 파일을 지운다. DB 기록이 없는 파일은 누구도 지우지 못한다. */
    private void removeIfRolledBack(String storageKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    return;
                }
                try {
                    deleteAll(List.of(storageKey));
                } catch (RuntimeException exception) {
                    log.error("저장되지 않은 결과의 페르소나 이미지 파일을 지우지 못했습니다. key={}", storageKey, exception);
                }
            }
        });
    }

    public void deleteAll(Collection<String> storageKeys) {
        for (String storageKey : storageKeys) {
            try {
                Path target = root.resolve(storageKey).normalize();
                requireInsideRoot(target);
                Files.deleteIfExists(target);
                Path parent = target.getParent();
                if (parent != null && !parent.equals(root) && Files.isDirectory(parent)) {
                    try (var children = Files.list(parent)) {
                        if (children.findAny().isEmpty()) {
                            Files.deleteIfExists(parent);
                        }
                    }
                }
            } catch (IOException exception) {
                throw new IllegalStateException("탈퇴 계정의 페르소나 이미지를 삭제하지 못했습니다.", exception);
            }
        }
    }

    private void requireInsideRoot(Path path) {
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage path");
        }
    }
}
