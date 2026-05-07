package com.taskManager.repository;
import java.util.*;

import com.taskManager.entity.Project;
import com.taskManager.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCreator(User creator);

    @Query("SELECT p FROM Project p JOIN p.members pm WHERE pm.user = :user")
    List<Project> findProjectsByMember(@Param("user") User user);

    @Query("SELECT DISTINCT p FROM Project p JOIN p.members pm WHERE pm.user = :user OR p.creator = :user")
    List<Project> findAllProjectsForUser(@Param("user") User user);
}
