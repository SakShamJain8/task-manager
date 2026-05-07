package com.taskManager.dto;
import lombok.Data;
import java.util.List;

@Data
public class DashboardDto {
    private long totalTasks;
    private long todoCount;
    private long inProgressCount;
    private long doneCount;
    private long overdueCount;
    private long totalProjects;
    private List<TaskPerUserDto> tasksPerUser;
    private List<TaskDto.Response> recentTasks;
    private List<TaskDto.Response> overdueTasks;

    @Data
    public static class TaskPerUserDto {
        private Long userId;
        private String userName;
        private long taskCount;
    }
}
