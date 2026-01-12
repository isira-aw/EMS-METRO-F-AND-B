package com.ems.controller;

import com.ems.dto.UserPutRequest;
import com.ems.dto.UserRequest;
import com.ems.entity.User;
import com.ems.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * Admin User Controller
 * Handles all user management operations for admins
 * Base path: /api/admin/users
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    /**
     * Create new user (employee or admin)
     * Validates unique username and email
     * Encrypts password with BCrypt
     *
     * @param request UserRequest DTO
     * @return Created User entity
     */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody UserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * Get all users (admins and employees)
     * Paginated and sorted by creation date
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @param sortBy Field to sort by (default "createdAt")
     * @param sortDir Sort direction (default "desc")
     * @return Page of User entities
     */
    @GetMapping
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Get all employees only
     * Filters by EMPLOYEE role and active status
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @param activeOnly Filter only active employees (default true)
     * @return Page of Employee User entities
     */
    @GetMapping("/employees")
    public ResponseEntity<Page<User>> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<User> employees = userService.getEmployees(pageable, activeOnly);
        return ResponseEntity.ok(employees);
    }

    /**
     * Get all admins only
     * Filters by ADMIN role
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of Admin User entities
     */
    @GetMapping("/admins")
    public ResponseEntity<Page<User>> getAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<User> admins = userService.getAdmins(pageable);
        return ResponseEntity.ok(admins);
    }

    /**
     * Get user by ID
     *
     * @param id User ID
     * @return User entity
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Update user details
     * Can update: fullName, email, phone, role, active status
     * Password is optional - only updated if provided
     *
     * @param id User ID
     * @param request UserRequest DTO
     * @return Updated User entity
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserPutRequest request) {
        User user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    /**
     * Delete user
     * Soft delete - sets active = false
     *
     * @param id User ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activate user account
     * Sets active = true
     *
     * @param id User ID
     * @return Updated User entity
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<User> activateUser(@PathVariable Long id) {
        User user = userService.activateUser(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Deactivate user account
     * Sets active = false
     *
     * @param id User ID
     * @return Updated User entity
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<User> deactivateUser(@PathVariable Long id) {
        User user = userService.deactivateUser(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Search users by name or email
     *
     * @param query Search query (matches fullName or email)
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of matching User entities
     */
    @GetMapping("/search")
    public ResponseEntity<Page<User>> searchUsers(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userService.searchUsers(query, pageable);
        return ResponseEntity.ok(users);
    }
}
