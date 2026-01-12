package com.ems.repository;

import com.ems.entity.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {
    List<TicketAssignment> findByMainTicketId(Long mainTicketId);
    List<TicketAssignment> findByEmployeeId(Long employeeId);
}
