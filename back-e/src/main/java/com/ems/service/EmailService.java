package com.ems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}. Error: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String resetToken, String resetUrl) {
        String subject = "Password Reset Request - Metropolitan EMS";
        String body = String.format(
            "Hello,\n\n" +
            "We received a request to reset your password for your Metropolitan EMS account.\n\n" +
            "Click the link below to reset your password:\n" +
            "%s/reset-password?token=%s\n\n" +
            "This link will expire in 15 minutes.\n\n" +
            "If you did not request a password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            resetUrl, resetToken
        );

        sendEmail(to, subject, body);
    }

    public void sendTicketCompletionEmail(String to, String ticketNumber, String generatorName, String summary) {
        String subject = "Ticket Completed - " + ticketNumber;
        String body = String.format(
            "Dear Generator Owner,\n\n" +
            "We are pleased to inform you that the service ticket for your generator has been completed.\n\n" +
            "Ticket Reference: %s\n" +
            "Generator: %s\n" +
            "Status: COMPLETED\n\n" +
            "Summary:\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            ticketNumber, generatorName, summary
        );

        sendEmail(to, subject, body);
    }

    public void sendCustomEmail(String to, String ticketNumber, String generatorName, String customMessage) {
        String subject = "Service Update - Ticket " + ticketNumber;
        String body = String.format(
            "Dear Generator Owner,\n\n" +
            "This is an update regarding your service ticket.\n\n" +
            "Ticket Reference: %s\n" +
            "Generator: %s\n\n" +
            "Message:\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.\n\n" +
            "Best regards,\n" +
            "Metropolitan EMS Team",
            ticketNumber, generatorName, customMessage
        );

        sendEmail(to, subject, body);
    }
}
