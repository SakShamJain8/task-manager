package com.taskManager.repository;

import com.taskManager.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Optional<Otp> findByEmailAndCodeAndPurpose(String email, String code, String purpose);
    Optional<Otp> findByEmailAndPurposeAndVerifiedFalse(String email, String purpose);
    void deleteByExpiresAtBefore(LocalDateTime time);
    Optional<Otp> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);
}
