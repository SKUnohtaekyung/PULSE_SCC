package kr.co.scc.api.analysis.infrastructure;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.Collection;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Component;

@Component
public class PersonaImageStorage {

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
            return root.relativize(target).toString().replace('\\', '/');
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
