package com.taskManager.repository;
import com.taskManager.entity.Task;
import com.taskManager.entity.Project;
import com.taskManager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);

    List<Task> findByAssignee(User user);

    List<Task> findByProjectAndAssignee(Project project, User assignee);

    @Query("SELECT t FROM Task t WHERE t.project IN :projects")
    List<Task> findByProjectIn(@Param("projects") List<Project> projects);

    @Query("SELECT DISTINCT t FROM Task t JOIN FETCH t.project LEFT JOIN FETCH t.assignee LEFT JOIN FETCH t.createdBy WHERE t.project IN :projects")
    List<Task> findByProjectInWithDetails(@Param("projects") List<Project> projects);

    @Query("SELECT t FROM Task t JOIN t.project p JOIN p.members pm WHERE pm.user = :user OR t.assignee = :user OR p.creator = :user")
    List<Task> findAllTasksVisibleToUser(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project = :project AND t.status = :status")
    long countByProjectAndStatus(@Param("project") Project project, @Param("status") Task.Status status);

    @Query("SELECT t FROM Task t WHERE t.project = :project AND t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasksByProject(@Param("project") Project project, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t JOIN t.project p JOIN p.members pm WHERE (pm.user = :user OR p.creator = :user) AND t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasksForUser(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT DISTINCT t FROM Task t JOIN FETCH t.project LEFT JOIN FETCH t.assignee LEFT JOIN FETCH t.createdBy JOIN t.project p JOIN p.members pm WHERE (pm.user = :user OR p.creator = :user) AND t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasksForUserWithDetails(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT t.assignee.id, COUNT(t) FROM Task t WHERE t.project = :project GROUP BY t.assignee.id")
    List<Object[]> countTasksPerAssigneeByProject(@Param("project") Project project);
}
