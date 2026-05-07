package com.taskManager.service;

import com.taskManager.dto.AuthDto;
import com.taskManager.dto.TaskDto;
import com.taskManager.entity.Project;
import com.taskManager.entity.Task;
import com.taskManager.entity.User;
import com.taskManager.exception.AccessDeniedException;
import com.taskManager.exception.ResourceNotFoundException;
import com.taskManager.repository.TaskRepository;
import com.taskManager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    @Transactional
    public TaskDto.Response createTask(Long projectId, TaskDto.CreateRequest request, User creator) {
        Project project = projectService.findProjectById(projectId);
        projectService.requireAdmin(project, creator);

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssigneeId()));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .priority(request.getPriority() != null ? request.getPriority() : Task.Priority.MEDIUM)
                .status(Task.Status.TODO)
                .project(project)
                .assignee(assignee)
                .createdBy(creator)
                .build();

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskDto.Response> getProjectTasks(Long projectId, User user) {
        Project project = projectService.findProjectById(projectId);
        // Verify access - will throw if not member
        projectService.getProject(projectId, user);

        boolean isAdmin = projectService.isAdmin(project, user);
        List<Task> tasks;

        if (isAdmin) {
            tasks = taskRepository.findByProject(project);
        } else {
            tasks = taskRepository.findByProjectAndAssignee(project, user);
        }

        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskDto.Response getTask(Long taskId, User user) {
        Task task = findTaskById(taskId);
        verifyTaskAccess(task, user);
        return mapToResponse(task);
    }

    @Transactional
    public TaskDto.Response updateTask(Long taskId, TaskDto.UpdateRequest request, User user) {
        Task task = findTaskById(taskId);
        boolean isAdmin = projectService.isAdmin(task.getProject(), user);

        // Members can only update status of their own tasks
        if (!isAdmin) {
            if (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId())) {
                throw new AccessDeniedException("You can only update tasks assigned to you");
            }
            // Member can only update status
            if (request.getStatus() != null) task.setStatus(request.getStatus());
            return mapToResponse(taskRepository.save(task));
        }

        // Admin can update everything
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskDto.Response updateStatus(Long taskId, Task.Status status, User user) {
        Task task = findTaskById(taskId);
        boolean isAdmin = projectService.isAdmin(task.getProject(), user);

        if (!isAdmin && (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId()))) {
            throw new AccessDeniedException("You can only update status of tasks assigned to you");
        }

        task.setStatus(status);
        return mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(Long taskId, User user) {
        Task task = findTaskById(taskId);
        projectService.requireAdmin(task.getProject(), user);
        taskRepository.delete(task);
    }

    @Transactional(readOnly = true)
    public List<TaskDto.Response> getMyTasks(User user) {
        return taskRepository.findByAssignee(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Helpers
    private Task findTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
    }

    private void verifyTaskAccess(Task task, User user) {
        boolean isAdmin = projectService.isAdmin(task.getProject(), user);
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(user.getId());
        if (!isAdmin && !isAssignee) {
            throw new AccessDeniedException("You do not have access to this task");
        }
    }

    public TaskDto.Response mapToResponse(Task task) {
        TaskDto.Response res = new TaskDto.Response();
        res.setId(task.getId());
        res.setTitle(task.getTitle());
        res.setDescription(task.getDescription());
        res.setDueDate(task.getDueDate());
        res.setPriority(task.getPriority());
        res.setStatus(task.getStatus());
        res.setProjectId(task.getProject().getId());
        res.setProjectName(task.getProject().getName());
        res.setCreatedAt(task.getCreatedAt());
        res.setUpdatedAt(task.getUpdatedAt());

        // Overdue check
        res.setOverdue(task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != Task.Status.DONE);

        if (task.getAssignee() != null) {
            AuthDto.UserSummary assignee = new AuthDto.UserSummary();
            assignee.setId(task.getAssignee().getId());
            assignee.setName(task.getAssignee().getName());
            assignee.setEmail(task.getAssignee().getEmail());
            res.setAssignee(assignee);
        }

        if (task.getCreatedBy() != null) {
            AuthDto.UserSummary createdBy = new AuthDto.UserSummary();
            createdBy.setId(task.getCreatedBy().getId());
            createdBy.setName(task.getCreatedBy().getName());
            createdBy.setEmail(task.getCreatedBy().getEmail());
            res.setCreatedBy(createdBy);
        }

        return res;
    }
}
