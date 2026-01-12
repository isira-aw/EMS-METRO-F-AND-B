package com.ems.controller;

import com.ems.dto.GeneratorRequest;
import com.ems.entity.Generator;
import com.ems.entity.MainTicket;
import com.ems.service.GeneratorService;
import com.ems.service.TicketService;
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
 * Admin Generator Controller
 * Handles all generator asset management operations
 * Base path: /api/admin/generators
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/generators")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGeneratorController {

    private final GeneratorService generatorService;
    private final TicketService ticketService;

    /**
     * Create new generator
     * Registers a new generator unit for service tracking
     *
     * @param request GeneratorRequest DTO
     * @return Created Generator entity
     */
    @PostMapping
    public ResponseEntity<Generator> createGenerator(@Valid @RequestBody GeneratorRequest request) {
        Generator generator = generatorService.createGenerator(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(generator);
    }

    /**
     * Get all generators
     * Paginated and sorted
     *
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @param sortBy Field to sort by (default "createdAt")
     * @param sortDir Sort direction (default "desc")
     * @return Page of Generator entities
     */
    @GetMapping
    public ResponseEntity<Page<Generator>> getAllGenerators(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Generator> generators = generatorService.getAllGenerators(pageable);
        return ResponseEntity.ok(generators);
    }

    /**
     * Get generator by ID
     *
     * @param id Generator ID
     * @return Generator entity with full details
     */
    @GetMapping("/{id}")
    public ResponseEntity<Generator> getGeneratorById(@PathVariable Long id) {
        Generator generator = generatorService.getGeneratorById(id);
        return ResponseEntity.ok(generator);
    }

    /**
     * Update generator details
     * Can update all generator fields
     *
     * @param id Generator ID
     * @param request GeneratorRequest DTO
     * @return Updated Generator entity
     */
    @PutMapping("/{id}")
    public ResponseEntity<Generator> updateGenerator(
            @PathVariable Long id,
            @Valid @RequestBody GeneratorRequest request) {

        Generator generator = generatorService.updateGenerator(id, request);
        return ResponseEntity.ok(generator);
    }

    /**
     * Delete generator
     * Only allowed if no tickets are associated
     *
     * @param id Generator ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGenerator(@PathVariable Long id) {
        generatorService.deleteGenerator(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search generators by name
     *
     * @param name Search query (partial match, case-insensitive)
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of matching Generator entities
     */
    @GetMapping("/search/name")
    public ResponseEntity<Page<Generator>> searchByName(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Generator> generators = generatorService.searchByName(name, pageable);
        return ResponseEntity.ok(generators);
    }

    /**
     * Search generators by location
     *
     * @param location Search query (partial match, case-insensitive)
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of matching Generator entities
     */
    @GetMapping("/search/location")
    public ResponseEntity<Page<Generator>> searchByLocation(
            @RequestParam String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Generator> generators = generatorService.searchByLocation(location, pageable);
        return ResponseEntity.ok(generators);
    }

    /**
     * Get all tickets for a specific generator
     * Shows service history
     *
     * @param id Generator ID
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of MainTicket entities for this generator
     */
    @GetMapping("/{id}/tickets")
    public ResponseEntity<Page<MainTicket>> getTicketsByGenerator(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<MainTicket> tickets = ticketService.getTicketsByGenerator(id, pageable);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Get generator statistics
     * Total tickets, completed, pending, average completion time
     *
     * @param id Generator ID
     * @return Statistics map
     */
    @GetMapping("/{id}/statistics")
    public ResponseEntity<?> getGeneratorStatistics(@PathVariable Long id) {
        var stats = generatorService.getGeneratorStatistics(id);
        return ResponseEntity.ok(stats);
    }
}
