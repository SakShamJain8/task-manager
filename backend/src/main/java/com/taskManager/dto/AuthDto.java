package com.taskManager.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
public class AuthDto {
    @Data
    public static class SignupRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String name;
        private String email;

        public AuthResponse(String token, Long id, String name, String email) {
            this.token = token;
            this.id = id;
            this.name = name;
            this.email = email;
        }
    }

    @Data
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }

    @Data
    public static class OtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Purpose is required (signup/login)")
        private String purpose; // "signup" or "login"
    }

    @Data
    public static class SignupInitiateResponse {
        private String message;
        private String email;
        private int expiresIn;

        public SignupInitiateResponse(String message, String email, int expiresIn) {
            this.message = message;
            this.email = email;
            this.expiresIn = expiresIn;
        }
    }

    @Data
    public static class SignupCompleteRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "OTP code is required")
        private String otpCode;
    }

    @Data
    public static class LoginInitiateResponse {
        private String message;
        private String email;
        private int expiresIn;

        public LoginInitiateResponse(String message, String email, int expiresIn) {
            this.message = message;
            this.email = email;
            this.expiresIn = expiresIn;
        }
    }

    @Data
    public static class LoginCompleteRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "OTP code is required")
        private String otpCode;
    }

    @Data
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "OTP code is required")
        private String code;

        @NotBlank(message = "Purpose is required (signup/login)")
        private String purpose;
    }

    @Data
    public static class SignupWithOtpRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "OTP code is required")
        private String otpCode;
    }

    @Data
    public static class OtpResponse {
        private String message;
        private String email;
        private int expiresIn; // seconds

        public OtpResponse(String message, String email, int expiresIn) {
            this.message = message;
            this.email = email;
            this.expiresIn = expiresIn;
        }
    }
}
