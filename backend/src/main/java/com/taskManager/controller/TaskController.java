package com.taskManager.controller;

import com.taskManager.dto.TaskDto;
import com.taskManager.entity.User;
import com.taskManager.repository.UserRepository;
import com.taskManager.security.UserPrincipal;
import com.taskManager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;
    private final UserRepository userRepository;

    private User getUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskDto.Response> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskDto.CreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(projectId, request, getUser(principal)));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDto.Response>> getProjectTasks(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getProjectTasks(projectId, getUser(principal)));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto.Response> getTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getTask(taskId, getUser(principal)));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto.Response> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDto.UpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, getUser(principal)));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskDto.Response> updateStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskDto.StatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.updateStatus(taskId, request.getStatus(), getUser(principal)));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        taskService.deleteTask(taskId, getUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/my")
    public ResponseEntity<List<TaskDto.Response>> getMyTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getMyTasks(getUser(principal)));
    }
}
