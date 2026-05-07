package com.taskManager.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your OTP Code - Task Manager");
            message.setText(buildOtpEmailContent(otp));
            message.setFrom("noreply@taskmanager.com");
            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send OTP email", e);
        }
    }

    private String buildOtpEmailContent(String otp) {
        return "Your One-Time Password (OTP) for Task Manager authentication is:\n\n" +
               otp + "\n\n" +
               "This code will expire in 5 minutes.\n" +
               "If you did not request this code, please ignore this email.\n\n" +
               "Best regards,\n" +
               "Task Manager Team";
    }
}
