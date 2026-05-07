package com.taskManager.service;

import com.taskManager.dto.AuthDto;
import com.taskManager.entity.User;
import com.taskManager.exception.ResourceNotFoundException;
import com.taskManager.repository.UserRepository;
import com.taskManager.security.JwtTokenProvider;
import com.taskManager.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final int OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    // ===== Integrated OTP-based Signup Flow =====

    @Transactional
    public AuthDto.SignupInitiateResponse initiateSignup(AuthDto.SignupRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Validate input
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }

        // Generate and send OTP
        otpService.generateAndSendOtp(request.getEmail(), "signup");

        return new AuthDto.SignupInitiateResponse(
                "OTP sent to your email. Please verify to complete signup.",
                request.getEmail(),
                OTP_EXPIRY_SECONDS
        );
    }

    @Transactional
    public AuthDto.AuthResponse completeSignupWithOtp(AuthDto.SignupCompleteRequest request) {
        // Verify OTP
        try {
            otpService.verifyOtp(request.getEmail(), request.getOtpCode(), "signup");
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("OTP verification failed: " + e.getMessage());
        }

        // Check if email already exists (double check)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        // Clean up OTP
        otpService.deleteOtp(request.getEmail(), "signup");

        // Generate JWT token
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    // ===== Traditional password-based signup (fallback) =====

    @Transactional
    public AuthDto.AuthResponse signup(AuthDto.SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    // ===== Integrated OTP-based Login Flow =====

    @Transactional
    public AuthDto.LoginInitiateResponse initiateLogin(AuthDto.LoginRequest request) {
        // Verify credentials first
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Credentials are valid, generate and send OTP
            otpService.generateAndSendOtp(request.getEmail(), "login");

            return new AuthDto.LoginInitiateResponse(
                    "Credentials verified. OTP sent to your email.",
                    request.getEmail(),
                    OTP_EXPIRY_SECONDS
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid email or password");
        }
    }

    @Transactional
    public AuthDto.AuthResponse completeLoginWithOtp(AuthDto.LoginCompleteRequest request) {
        // Verify OTP
        try {
            otpService.verifyOtp(request.getEmail(), request.getOtpCode(), "login");
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("OTP verification failed: " + e.getMessage());
        }

        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Clean up OTP
        otpService.deleteOtp(request.getEmail(), "login");

        // Generate JWT token
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    // ===== Traditional password-based login (fallback) =====

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return new AuthDto.AuthResponse(token, userPrincipal.getId(),
                userPrincipal.getName(), userPrincipal.getEmail());
    }

    public AuthDto.UserSummary getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        AuthDto.UserSummary summary = new AuthDto.UserSummary();
        summary.setId(user.getId());
        summary.setName(user.getName());
        summary.setEmail(user.getEmail());
        return summary;
    }

    // ===== Password-less OTP-based Signup (Simple Flow) =====

    @Transactional
    public AuthDto.SignupInitiateResponse requestSignupOtp(String email, String purpose) {
        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Generate and send OTP
        otpService.generateAndSendOtp(email, purpose);

        return new AuthDto.SignupInitiateResponse(
                "OTP sent to your email. Please verify to complete signup.",
                email,
                OTP_EXPIRY_SECONDS
        );
    }

    @Transactional
    public AuthDto.AuthResponse signupWithOtp(AuthDto.SignupWithOtpRequest request) {
        // Verify OTP
        try {
            otpService.verifyOtp(request.getEmail(), request.getOtpCode(), "signup");
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("OTP verification failed: " + e.getMessage());
        }

        // Check if email already exists (double check)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        // Clean up OTP
        otpService.deleteOtp(request.getEmail(), "signup");

        // Generate JWT token
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    // ===== Password-less OTP-based Login (Simple Flow) =====

    @Transactional
    public AuthDto.LoginInitiateResponse requestLoginOtp(String email, String purpose) {
        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        // Generate and send OTP
        otpService.generateAndSendOtp(email, purpose);

        return new AuthDto.LoginInitiateResponse(
                "OTP sent to your email. Please verify to login.",
                email,
                OTP_EXPIRY_SECONDS
        );
    }

    @Transactional
    public AuthDto.AuthResponse loginWithOtp(AuthDto.VerifyOtpRequest request) {
        // Verify OTP
        try {
            otpService.verifyOtp(request.getEmail(), request.getCode(), request.getPurpose());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("OTP verification failed: " + e.getMessage());
        }

        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Clean up OTP
        otpService.deleteOtp(request.getEmail(), request.getPurpose());

        // Generate JWT token
        String token = tokenProvider.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public AuthDto.OtpResponse verifyOtp(AuthDto.VerifyOtpRequest request) {
        try {
            otpService.verifyOtp(request.getEmail(), request.getCode(), request.getPurpose());
            return new AuthDto.OtpResponse("OTP verified successfully", request.getEmail(), OTP_EXPIRY_SECONDS);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("OTP verification failed: " + e.getMessage());
        }
    }
}
