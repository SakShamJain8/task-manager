package com.taskManager.repository;


import com.taskManager.entity.Project;
import com.taskManager.entity.ProjectMember;
import com.taskManager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    List<ProjectMember> findByProject(Project project);
    boolean existsByProjectAndUser(Project project, User user);
    void deleteByProjectAndUser(Project project, User user);
}
