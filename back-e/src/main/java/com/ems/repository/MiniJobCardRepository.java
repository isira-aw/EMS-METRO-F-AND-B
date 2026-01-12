package com.ems.repository;

import com.ems.entity.JobStatus;
import com.ems.entity.MiniJobCard;
import com.ems.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MiniJobCardRepository extends JpaRepository<MiniJobCard, Long> {
    Page<MiniJobCard> findByEmployee(User employee, Pageable pageable);
    Page<MiniJobCard> findByEmployeeAndStatus(User employee, JobStatus status, Pageable pageable);
    List<MiniJobCard> findByMainTicketId(Long mainTicketId);
    Page<MiniJobCard> findByMainTicketId(Long mainTicketId, Pageable pageable);

    long countByEmployeeAndMainTicket_ScheduledDateAndStatus(
            User employee,
            LocalDate scheduledDate,
            JobStatus status
    );
}
