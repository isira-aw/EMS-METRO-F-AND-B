package com.ems.repository;

import com.ems.entity.PasswordResetToken;
import com.ems.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUserAndUsedFalseAndExpiryDateAfter(User user, LocalDateTime currentDate);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiryDate < :date")
    void deleteExpiredTokens(LocalDateTime date);

    void deleteByUser(User user);
}
