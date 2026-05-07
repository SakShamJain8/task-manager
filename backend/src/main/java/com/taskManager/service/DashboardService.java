package com.taskManager.service;

import com.taskManager.dto.DashboardDto;
import com.taskManager.dto.TaskDto;
import com.taskManager.entity.Project;
import com.taskManager.entity.Task;
import com.taskManager.entity.User;
import com.taskManager.repository.ProjectRepository;
import com.taskManager.repository.TaskRepository;
import com.taskManager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;

    @Transactional(readOnly = true)
    public DashboardDto getDashboard(User user) {
        List<Project> userProjects = projectRepository.findAllProjectsForUser(user);
        List<Task> allTasks = taskRepository.findByProjectInWithDetails(userProjects);
        List<Task> overdueTasks = taskRepository.findOverdueTasksForUserWithDetails(user, LocalDate.now());

        DashboardDto dashboard = new DashboardDto();
        dashboard.setTotalProjects(userProjects.size());
        dashboard.setTotalTasks(allTasks.size());
        dashboard.setTodoCount(allTasks.stream().filter(t -> t.getStatus() == Task.Status.TODO).count());
        dashboard.setInProgressCount(allTasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count());
        dashboard.setDoneCount(allTasks.stream().filter(t -> t.getStatus() == Task.Status.DONE).count());
        dashboard.setOverdueCount(overdueTasks.size());

        // Tasks per user
        List<DashboardDto.TaskPerUserDto> tasksPerUser = new ArrayList<>();
        userRepository.findAll().forEach(u -> {
            long count = allTasks.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(u.getId()))
                    .count();
            if (count > 0) {
                DashboardDto.TaskPerUserDto dto = new DashboardDto.TaskPerUserDto();
                dto.setUserId(u.getId());
                dto.setUserName(u.getName());
                dto.setTaskCount(count);
                tasksPerUser.add(dto);
            }
        });
        dashboard.setTasksPerUser(tasksPerUser);

        // Recent tasks (last 5)
        List<TaskDto.Response> recentTasks = allTasks.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .map(taskService::mapToResponse)
                .collect(Collectors.toList());
        dashboard.setRecentTasks(recentTasks);

        // Overdue tasks
        dashboard.setOverdueTasks(overdueTasks.stream()
                .map(taskService::mapToResponse)
                .collect(Collectors.toList()));

        return dashboard;
    }
}
