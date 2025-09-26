package ai.cosplay.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.base.url}")
    private String baseUrl;

    // 允许的文件格式
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostConstruct
    public void init() {
        try {
            // 创建必要的目录
            Path avatarPath = Paths.get(uploadDir, "avatars");
            Path defaultPath = Paths.get(uploadDir, "default");

            Files.createDirectories(avatarPath);
            Files.createDirectories(defaultPath);

            log.info("文件存储目录初始化完成:");
            log.info(" - 上传目录: {}", Paths.get(uploadDir).toAbsolutePath());
            log.info(" - 头像目录: {}", avatarPath.toAbsolutePath());

        } catch (IOException e) {
            log.error("创建文件存储目录失败: {}", e.getMessage());
        }
    }

    /**
     * 验证图片文件
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        // 检查文件大小
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("文件大小不能超过5MB");
        }

        // 检查文件格式
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("文件名不能为空");
        }

        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
            throw new IllegalArgumentException("不支持的文件格式。支持格式: " +
                    String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    /**
     * 保存头像文件
     */
    public String saveAvatar(MultipartFile file, String customFilename) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // 创建上传目录
        Path uploadPath = Paths.get(uploadDir, "avatars");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 生成文件名
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String filename = customFilename + fileExtension;

        // 保存文件
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        // 返回访问URL
        String avatarUrl = baseUrl + "/uploads/avatars/" + filename;
        log.info("头像保存成功: {}", avatarUrl);

        return avatarUrl;
    }


    /**
     * 获取默认头像URL
     */
    public String getDefaultAvatar() {
        return baseUrl + "/uploads/default/默认头像.png";
    }



    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}