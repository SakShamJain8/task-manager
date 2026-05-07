package com.taskManager.controller;

import com.taskManager.dto.AuthDto;
import com.taskManager.security.UserPrincipal;
import com.taskManager.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    // ===== Password-less OTP-based Signup (Simple Flow) =====
    @PostMapping("/request-signup-otp")
    public ResponseEntity<AuthDto.SignupInitiateResponse> requestSignupOtp(@Valid @RequestBody AuthDto.OtpRequest request) {
        return ResponseEntity.ok(authService.requestSignupOtp(request.getEmail(), request.getPurpose()));
    }

    @PostMapping("/signup-with-otp")
    public ResponseEntity<AuthDto.AuthResponse> signupWithOtp(@Valid @RequestBody AuthDto.SignupWithOtpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signupWithOtp(request));
    }

    // ===== Password-less OTP-based Login (Simple Flow) =====
    @PostMapping("/request-login-otp")
    public ResponseEntity<AuthDto.LoginInitiateResponse> requestLoginOtp(@Valid @RequestBody AuthDto.OtpRequest request) {
        return ResponseEntity.ok(authService.requestLoginOtp(request.getEmail(), request.getPurpose()));
    }

    @PostMapping("/login-with-otp")
    public ResponseEntity<AuthDto.AuthResponse> loginWithOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.loginWithOtp(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthDto.OtpResponse> verifyOtp(@Valid @RequestBody AuthDto.VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    // ===== Integrated OTP-based Signup =====
    @PostMapping("/signup")
    public ResponseEntity<AuthDto.SignupInitiateResponse> initiateSignup(@Valid @RequestBody AuthDto.SignupRequest request) {
        return ResponseEntity.ok(authService.initiateSignup(request));
    }

    @PostMapping("/signup-verify")
    public ResponseEntity<AuthDto.AuthResponse> completeSignup(@Valid @RequestBody AuthDto.SignupCompleteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.completeSignupWithOtp(request));
    }

    // ===== Integrated OTP-based Login =====
    @PostMapping("/login")
    public ResponseEntity<AuthDto.LoginInitiateResponse> initiateLogin(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.initiateLogin(request));
    }

    @PostMapping("/login-verify")
    public ResponseEntity<AuthDto.AuthResponse> completeLogin(@Valid @RequestBody AuthDto.LoginCompleteRequest request) {
        return ResponseEntity.ok(authService.completeLoginWithOtp(request));
    }

    // ===== Traditional authentication (fallback) =====
    @PostMapping("/login-traditional")
    public ResponseEntity<AuthDto.AuthResponse> loginTraditional(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/signup-traditional")
    public ResponseEntity<AuthDto.AuthResponse> signupTraditional(@Valid @RequestBody AuthDto.SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.UserSummary> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(authService.getCurrentUser(userPrincipal.getId()));
    }
}
