package com.ems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.api.url}")
    private String whatsappApiUrl;

    @Value("${whatsapp.api.token}")
    private String whatsappApiToken;

    @Value("${whatsapp.phone.number.id}")
    private String whatsappPhoneNumberId;

    public void sendWhatsAppMessage(String to, String message) {
        try {
            // Remove any non-numeric characters from phone number
            String cleanPhoneNumber = to.replaceAll("[^0-9]", "");

            // Construct the API URL
            String url = whatsappApiUrl + "/" + whatsappPhoneNumberId + "/messages";

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(whatsappApiToken);

            // Prepare request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("to", cleanPhoneNumber);
            requestBody.put("type", "text");

            Map<String, String> textBody = new HashMap<>();
            textBody.put("body", message);
            requestBody.put("text", textBody);

            // Send request
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("WhatsApp message sent successfully to: {}", cleanPhoneNumber);
            } else {
                log.error("Failed to send WhatsApp message. Status: {}, Response: {}",
                    response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send WhatsApp message to: {}. Error: {}", to, e.getMessage());
            // Don't throw exception - allow app to continue even if WhatsApp fails
        }
    }

    public void sendPasswordResetWhatsApp(String to, String resetToken, String resetUrl) {
        String message = String.format(
            "*Password Reset Request - Metropolitan EMS*\n\n" +
            "We received a request to reset your password.\n\n" +
            "Click the link below to reset your password:\n" +
            "%s/reset-password?token=%s\n\n" +
            "This link will expire in 15 minutes.\n\n" +
            "If you did not request a password reset, please ignore this message.",
            resetUrl, resetToken
        );

        sendWhatsAppMessage(to, message);
    }

    public void sendTicketCompletionWhatsApp(String to, String ticketNumber, String generatorName, String summary) {
        String message = String.format(
            "*Ticket Completed - %s*\n\n" +
            "Dear Generator Owner,\n\n" +
            "We are pleased to inform you that the service ticket for your generator has been completed.\n\n" +
            "*Ticket Reference:* %s\n" +
            "*Generator:* %s\n" +
            "*Status:* COMPLETED\n\n" +
            "*Summary:*\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.",
            ticketNumber, ticketNumber, generatorName, summary
        );

        sendWhatsAppMessage(to, message);
    }

    public void sendCustomWhatsApp(String to, String ticketNumber, String generatorName, String customMessage) {
        String message = String.format(
            "*Service Update - Ticket %s*\n\n" +
            "Dear Generator Owner,\n\n" +
            "This is an update regarding your service ticket.\n\n" +
            "*Ticket Reference:* %s\n" +
            "*Generator:* %s\n\n" +
            "*Message:*\n%s\n\n" +
            "Thank you for choosing Metropolitan EMS.",
            ticketNumber, ticketNumber, generatorName, customMessage
        );

        sendWhatsAppMessage(to, message);
    }
}
