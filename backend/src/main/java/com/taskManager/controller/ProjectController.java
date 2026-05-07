package com.taskManager.controller;

import com.taskManager.dto.AuthDto;
import com.taskManager.dto.ProjectDto;
import com.taskManager.entity.User;
import com.taskManager.repository.UserRepository;
import com.taskManager.security.UserPrincipal;
import com.taskManager.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService projectService;
    private final UserRepository userRepository;

    private User getUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping
    public ResponseEntity<ProjectDto.Response> createProject(
            @Valid @RequestBody ProjectDto.CreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.createProject(request, getUser(principal)));
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto.Response>> getMyProjects(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getMyProjects(getUser(principal)));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectDto.Response> getProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getProject(projectId, getUser(principal)));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectDto.Response> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDto.UpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.updateProject(projectId, request, getUser(principal)));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        projectService.deleteProject(projectId, getUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectDto.MemberResponse>> getMembers(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.getProjectMembers(projectId, getUser(principal)));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectDto.MemberResponse> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectDto.AddMemberRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addMember(projectId, request, getUser(principal)));
    }

    @PutMapping("/{projectId}/members/{userId}/role")
    public ResponseEntity<ProjectDto.MemberResponse> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @Valid @RequestBody ProjectDto.UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.updateMemberRole(projectId, userId, request, getUser(principal)));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        projectService.removeMember(projectId, userId, getUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public ResponseEntity<List<AuthDto.UserSummary>> getAllUsers() {
        return ResponseEntity.ok(projectService.getAllUsers());
    }
}
