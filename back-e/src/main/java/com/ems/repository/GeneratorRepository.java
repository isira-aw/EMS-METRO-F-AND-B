package com.ems.repository;

import com.ems.entity.Generator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeneratorRepository extends JpaRepository<Generator, Long> {
    Page<Generator> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Page<Generator> findByLocationNameContainingIgnoreCase(String location, Pageable pageable);
}
