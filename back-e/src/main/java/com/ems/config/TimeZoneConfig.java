package com.ems.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;

/**
 * Centralized timezone configuration for the application.
 * This ensures consistent timezone handling across all services,
 * regardless of the server's physical location.
 */
@Configuration
public class TimeZoneConfig {

    @Value("${app.timezone:Asia/Colombo}")
    private String timeZoneId;

    /**
     * Get the configured ZoneId for the application.
     * Defaults to Asia/Colombo if not specified.
     *
     * @return ZoneId configured for the application
     */
    public ZoneId getZoneId() {
        return ZoneId.of(timeZoneId);
    }

    /**
     * Get the timezone ID as a string.
     *
     * @return String representation of the timezone ID
     */
    public String getTimeZoneId() {
        return timeZoneId;
    }
}
