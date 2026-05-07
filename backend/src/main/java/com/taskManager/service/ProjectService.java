package com.taskManager.service;
import java.util.*;
import java.util.stream.Collectors;

import com.taskManager.dto.AuthDto;
import com.taskManager.dto.ProjectDto;
import com.taskManager.entity.Project;
import com.taskManager.entity.ProjectMember;
import com.taskManager.entity.User;
import com.taskManager.exception.AccessDeniedException;
import com.taskManager.exception.ResourceNotFoundException;
import com.taskManager.repository.ProjectMemberRepository;
import com.taskManager.repository.ProjectRepository;
import com.taskManager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectDto.Response createProject(ProjectDto.CreateRequest request, User creator) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .creator(creator)
                .build();
        project = projectRepository.save(project);

        // Creator is automatically ADMIN
        ProjectMember adminMember = ProjectMember.builder()
                .project(project)
                .user(creator)
                .role(ProjectMember.Role.ADMIN)
                .build();
        memberRepository.save(adminMember);

        return mapToResponse(project, ProjectMember.Role.ADMIN);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.Response> getMyProjects(User user) {
        List<Project> projects = projectRepository.findAllProjectsForUser(user);
        return projects.stream()
                .map(p -> {
                    ProjectMember.Role role = memberRepository.findByProjectAndUser(p, user)
                            .map(ProjectMember::getRole)
                            .orElse(ProjectMember.Role.MEMBER);
                    return mapToResponse(p, role);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto.Response getProject(Long projectId, User user) {
        Project project = findProjectById(projectId);
        ProjectMember member = getMemberOrThrow(project, user);
        return mapToResponse(project, member.getRole());
    }

    @Transactional
    public ProjectDto.Response updateProject(Long projectId, ProjectDto.UpdateRequest request, User user) {
        Project project = findProjectById(projectId);
        requireAdmin(project, user);

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());

        return mapToResponse(projectRepository.save(project), ProjectMember.Role.ADMIN);
    }

    @Transactional
    public void deleteProject(Long projectId, User user) {
        Project project = findProjectById(projectId);
        if (!project.getCreator().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the project creator can delete the project");
        }
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectDto.MemberResponse addMember(Long projectId, ProjectDto.AddMemberRequest request, User admin) {
        Project project = findProjectById(projectId);
        requireAdmin(project, admin);

        User newMember = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByProjectAndUser(project, newMember)) {
            throw new IllegalArgumentException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(newMember)
                .role(request.getRole() == null ? ProjectMember.Role.MEMBER : request.getRole())
                .build();
        member = memberRepository.save(member);

        return mapMemberToResponse(member);
    }

    @Transactional
    public ProjectDto.MemberResponse updateMemberRole(Long projectId, Long userId, ProjectDto.UpdateMemberRoleRequest request, User admin) {
        Project project = findProjectById(projectId);
        requireAdmin(project, admin);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (targetUser.getId().equals(project.getCreator().getId())) {
            throw new IllegalArgumentException("Cannot change the project creator role");
        }

        ProjectMember member = memberRepository.findByProjectAndUser(project, targetUser)
                .orElseThrow(() -> new ResourceNotFoundException("Project member", userId));

        member.setRole(request.getRole());
        member = memberRepository.save(member);
        return mapMemberToResponse(member);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId, User admin) {
        Project project = findProjectById(projectId);
        requireAdmin(project, admin);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (targetUser.getId().equals(project.getCreator().getId())) {
            throw new IllegalArgumentException("Cannot remove the project creator");
        }

        memberRepository.deleteByProjectAndUser(project, targetUser);
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.MemberResponse> getProjectMembers(Long projectId, User user) {
        Project project = findProjectById(projectId);
        getMemberOrThrow(project, user); // just verify access
        return memberRepository.findByProject(project).stream()
                .map(this::mapMemberToResponse)
                .collect(Collectors.toList());
    }

    public List<AuthDto.UserSummary> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    AuthDto.UserSummary s = new AuthDto.UserSummary();
                    s.setId(u.getId());
                    s.setName(u.getName());
                    s.setEmail(u.getEmail());
                    return s;
                })
                .collect(Collectors.toList());
    }

    // Helpers
    public Project findProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private ProjectMember getMemberOrThrow(Project project, User user) {
        return memberRepository.findByProjectAndUser(project, user)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this project"));
    }

    public void requireAdmin(Project project, User user) {
        ProjectMember member = getMemberOrThrow(project, user);
        if (member.getRole() != ProjectMember.Role.ADMIN) {
            throw new AccessDeniedException("Only admins can perform this action");
        }
    }

    public boolean isAdmin(Project project, User user) {
        return memberRepository.findByProjectAndUser(project, user)
                .map(m -> m.getRole() == ProjectMember.Role.ADMIN)
                .orElse(false);
    }

    private ProjectDto.Response mapToResponse(Project project, ProjectMember.Role role) {
        ProjectDto.Response res = new ProjectDto.Response();
        res.setId(project.getId());
        res.setName(project.getName());
        res.setDescription(project.getDescription());
        res.setCurrentUserRole(role);
        res.setCreatedAt(project.getCreatedAt());

        AuthDto.UserSummary creator = new AuthDto.UserSummary();
        creator.setId(project.getCreator().getId());
        creator.setName(project.getCreator().getName());
        creator.setEmail(project.getCreator().getEmail());
        res.setCreator(creator);

        res.setMemberCount(project.getMembers().size());
        res.setTaskCount(project.getTasks().size());
        return res;
    }

    private ProjectDto.MemberResponse mapMemberToResponse(ProjectMember member) {
        ProjectDto.MemberResponse res = new ProjectDto.MemberResponse();
        res.setId(member.getId());
        res.setRole(member.getRole());
        res.setJoinedAt(member.getJoinedAt());

        AuthDto.UserSummary userSummary = new AuthDto.UserSummary();
        userSummary.setId(member.getUser().getId());
        userSummary.setName(member.getUser().getName());
        userSummary.setEmail(member.getUser().getEmail());
        res.setUser(userSummary);
        return res;
    }
}
