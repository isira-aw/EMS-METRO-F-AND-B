package com.ems.service;

import com.ems.dto.GeneratorRequest;
import com.ems.entity.Generator;
import com.ems.entity.MainTicket;
import com.ems.entity.JobStatus;
import com.ems.repository.GeneratorRepository;
import com.ems.repository.MainTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeneratorService {
    
    @Autowired
    private GeneratorRepository generatorRepository;

    @Autowired
    private MainTicketRepository mainTicketRepository;
    
    public Generator createGenerator(GeneratorRequest request) {
        Generator generator = new Generator();
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setWhatsAppNumber(request.getWhatsAppNumber());
        generator.setLandlineNumber(request.getLandlineNumber());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public Page<Generator> getAllGenerators(Pageable pageable) {
        return generatorRepository.findAll(pageable);
    }
    
    public Generator getGeneratorById(Long id) {
        return generatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Generator not found"));
    }
    
    public Generator updateGenerator(Long id, GeneratorRequest request) {
        Generator generator = getGeneratorById(id);
        
        generator.setModel(request.getModel());
        generator.setName(request.getName());
        generator.setCapacity(request.getCapacity());
        generator.setLocationName(request.getLocationName());
        generator.setOwnerEmail(request.getOwnerEmail());
        generator.setWhatsAppNumber(request.getWhatsAppNumber());
        generator.setLandlineNumber(request.getLandlineNumber());
        generator.setNote(request.getNote());
        
        return generatorRepository.save(generator);
    }
    
    public void deleteGenerator(Long id) {
        generatorRepository.deleteById(id);
    }

    public Page<Generator> searchByName(String name, Pageable pageable) {
        return generatorRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    public Page<Generator> searchByLocation(String location, Pageable pageable) {
        return generatorRepository.findByLocationNameContainingIgnoreCase(location, pageable);
    }

    public Map<String, Object> getGeneratorStatistics(Long id) {
        Generator generator = getGeneratorById(id);

        List<MainTicket> allTickets = mainTicketRepository.findAll().stream()
                .filter(t -> t.getGenerator().getId().equals(id))
                .toList();

        long totalTickets = allTickets.size();
        long completedTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.COMPLETED)
                .count();
        long pendingTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.PENDING)
                .count();
        long activeTickets = allTickets.stream()
                .filter(t -> t.getStatus() == JobStatus.STARTED ||
                        t.getStatus() == JobStatus.TRAVELING)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("generatorId", id);
        stats.put("generatorName", generator.getName());
        stats.put("totalTickets", totalTickets);
        stats.put("completedTickets", completedTickets);
        stats.put("pendingTickets", pendingTickets);
        stats.put("activeTickets", activeTickets);
        stats.put("completionRate", totalTickets > 0 ? (completedTickets * 100.0 / totalTickets) : 0);

        return stats;
    }
}
