package com.taskManager.dto;
import com.taskManager.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
public class TaskDto {
    @Data
    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 200)
        private String title;

        @Size(max = 1000)
        private String description;

        private LocalDate dueDate;

        private Task.Priority priority = Task.Priority.MEDIUM;

        private Long assigneeId;
    }

    @Data
    public static class UpdateRequest {
        @Size(min = 2, max = 200)
        private String title;

        @Size(max = 1000)
        private String description;

        private LocalDate dueDate;

        private Task.Priority priority;

        private Task.Status status;

        private Long assigneeId;
    }

    @Data
    public static class StatusUpdateRequest {
        @NotNull(message = "Status is required")
        private Task.Status status;
    }

    @Data
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private LocalDate dueDate;
        private Task.Priority priority;
        private Task.Status status;
        private Long projectId;
        private String projectName;
        private AuthDto.UserSummary assignee;
        private AuthDto.UserSummary createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean overdue;
    }
}
