package com.taskManager.service;

import com.taskManager.entity.Otp;
import com.taskManager.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {
    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 3;

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Transactional
    public void generateAndSendOtp(String email, String purpose) {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        String otpCode = generateOtpCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);
        Otp existingOtp = otpRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElse(null);

        if (existingOtp != null && existingOtp.getExpiresAt().isAfter(LocalDateTime.now())) {
            otpRepository.delete(existingOtp);
        }

        // Save new OTP
        Otp otp = Otp.builder()
                .email(email)
                .code(otpCode)
                .verified(false)
                .purpose(purpose)
                .expiresAt(expiresAt)
                .attempts(0)
                .maxAttempts(MAX_OTP_ATTEMPTS)
                .build();

        otpRepository.save(otp);
        emailService.sendOtpEmail(email, otpCode);
    }

    @Transactional
    public boolean verifyOtp(String email, String code, String purpose) {
        // Trim the code to handle any whitespace issues
        String trimmedCode = code.trim();
        
        // Find the OTP for this email and purpose
        Otp otp = otpRepository
                .findByEmailAndPurposeAndVerifiedFalse(email, purpose)
                .orElse(null);

        if (otp == null) {
            throw new RuntimeException("No active OTP request for this email");
        }

        // Check if OTP is expired
        if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
            otpRepository.delete(otp);
            throw new RuntimeException("OTP has expired. Please request a new OTP.");
        }

        // Check max attempts
        if (otp.getAttempts() >= MAX_OTP_ATTEMPTS) {
            otpRepository.delete(otp);
            throw new RuntimeException("Max OTP attempts exceeded. Please request a new OTP.");
        }

        // Verify OTP code
        if (!otp.getCode().trim().equals(trimmedCode)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            throw new RuntimeException("Invalid OTP code. " + (MAX_OTP_ATTEMPTS - otp.getAttempts()) + " attempts remaining.");
        }

        // Mark as verified
        otp.setVerified(true);
        otpRepository.save(otp);
        return true;
    }

    @Transactional
    public void deleteOtp(String email, String purpose) {
        Otp otp = otpRepository
                .findByEmailAndPurposeAndVerifiedFalse(email, purpose)
                .orElse(null);
        if (otp != null) {
            otpRepository.delete(otp);
        }
    }

    @Transactional
    public boolean isOtpVerified(String email, String purpose) {
        Otp otp = otpRepository
                .findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElse(null);

        if (otp == null) {
            return false;
        }

        return otp.isVerified() && LocalDateTime.now().isBefore(otp.getExpiresAt());
    }

    private String generateOtpCode() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
