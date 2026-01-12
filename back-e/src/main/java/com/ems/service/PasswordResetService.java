package com.ems.service;

import com.ems.entity.PasswordResetToken;
import com.ems.entity.User;
import com.ems.repository.PasswordResetTokenRepository;
import com.ems.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.password.reset.token.expiry.minutes:15}")
    private int tokenExpiryMinutes;

    @Transactional
    public boolean requestPasswordReset(String emailOrPhone) {
        // Try to find user by email or phone
        Optional<User> userOptional = userRepository.findByEmail(emailOrPhone);

        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByPhone(emailOrPhone);
        }

        // Check if user exists
        if (userOptional.isEmpty()) {
            log.warn("Password reset requested for non-existent user: {}", emailOrPhone);
            return false; // User not found
        }

        User user = userOptional.get();

        // Check if user is active
        if (Boolean.FALSE.equals(user.getActive())) {
            log.warn("Password reset requested for inactive user: {}", user.getUsername());
            return false; // User is inactive
        }

        // Invalidate any existing valid tokens for this user
        tokenRepository.deleteByUser(user);

        // Generate new token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(tokenExpiryMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // Send notification via email and/or WhatsApp
        notificationService.sendPasswordResetNotification(
                user.getEmail(),
                user.getPhone(),
                token,
                frontendUrl
        );

        log.info("Password reset token generated for user: {}", user.getUsername());
        return true; // User found and reset link sent
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid password reset token"));

        // Validate token
        if (!resetToken.isValid()) {
            throw new RuntimeException("Password reset token has expired or already been used");
        }

        User user = resetToken.getUser();

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {}", user.getUsername());
    }

    public void validateToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid password reset token"));

        if (!resetToken.isValid()) {
            throw new RuntimeException("Password reset token has expired or already been used");
        }
    }

    // Scheduled task to clean up expired tokens (runs daily at 2 AM)
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.deleteExpiredTokens(now);
        log.info("Cleaned up expired password reset tokens");
    }
}
