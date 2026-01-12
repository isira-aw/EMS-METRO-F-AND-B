package com.ems.config;

import com.ems.entity.User;
import com.ems.entity.UserRole;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Create default admin if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("System Administrator");
            admin.setRole(UserRole.ADMIN);
            admin.setEmail("admin@ems.com");
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("Default admin created: admin / admin123");
        }
        
        // Create default employee if not exists
        if (!userRepository.existsByUsername("employee")) {
            User employee = new User();
            employee.setUsername("employee");
            employee.setPassword(passwordEncoder.encode("emp123"));
            employee.setFullName("Test Employee");
            employee.setRole(UserRole.EMPLOYEE);
            employee.setEmail("employee@ems.com");
            employee.setActive(true);
            userRepository.save(employee);
            System.out.println("Default employee created: employee / emp123");
        }
    }
}
