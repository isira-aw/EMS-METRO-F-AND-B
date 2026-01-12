package com.ems.service;

import com.ems.dto.UserPutRequest;
import com.ems.dto.UserRequest;
import com.ems.entity.User;
import com.ems.entity.UserRole;
import com.ems.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User createUser(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setActive(request.getActive());
        
        return userRepository.save(user);
    }
    
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }
    
    public Page<User> getEmployees(Pageable pageable) {
        return userRepository.findByRoleAndActive(UserRole.EMPLOYEE, true, pageable);
    }

    public Page<User> getEmployees(Pageable pageable, boolean activeOnly) {
        if (activeOnly) {
            return userRepository.findByRoleAndActive(UserRole.EMPLOYEE, true, pageable);
        } else {
            return userRepository.findByRole(UserRole.EMPLOYEE, pageable);
        }
    }

    public Page<User> getAdmins(Pageable pageable) {
        return userRepository.findByRole(UserRole.ADMIN, pageable);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(Long id, UserPutRequest request) {
        User user = getUserById(id);

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());
        user.setActive(request.getActive());
        user.setRole(request.getRole());

//        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
//            user.setPassword(passwordEncoder.encode(request.getPassword()));
//        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    public User activateUser(Long id) {
        User user = getUserById(id);
        user.setActive(true);
        return userRepository.save(user);
    }

    public User deactivateUser(Long id) {
        User user = getUserById(id);
        user.setActive(false);
        return userRepository.save(user);
    }

    public Page<User> searchUsers(String query, Pageable pageable) {
        // Search by full name or email containing the query
        List<User> allUsers = userRepository.findAll();
        List<User> filtered = allUsers.stream()
                .filter(user -> user.getFullName().toLowerCase().contains(query.toLowerCase()) ||
                        (user.getEmail() != null && user.getEmail().toLowerCase().contains(query.toLowerCase())))
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        List<User> pageContent = start >= filtered.size() ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(pageContent, pageable, filtered.size());
    }
}
