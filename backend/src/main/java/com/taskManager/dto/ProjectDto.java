package com.taskManager.dto;
import com.taskManager.entity.ProjectMember;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;

public class ProjectDto {
    @Data
    public static class CreateRequest {
        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 100)
        private String name;

        @Size(max = 500)
        private String description;
    }

    @Data
    public static class UpdateRequest {
        @Size(min = 2, max = 100)
        private String name;

        @Size(max = 500)
        private String description;
    }

    @Data
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private AuthDto.UserSummary creator;
        private ProjectMember.Role currentUserRole;
        private int memberCount;
        private int taskCount;
        private LocalDateTime createdAt;
    }

    @Data
    public static class MemberResponse {
        private Long id;
        private AuthDto.UserSummary user;
        private ProjectMember.Role role;
        private LocalDateTime joinedAt;
    }

    @Data
    public static class AddMemberRequest {
        @NotBlank(message = "Email is required")
        private String email;

        @NotNull(message = "Role is required")
        private ProjectMember.Role role;
    }

    @Data
    public static class UpdateMemberRoleRequest {
        @NotNull(message = "Role is required")
        private ProjectMember.Role role;
    }
}
