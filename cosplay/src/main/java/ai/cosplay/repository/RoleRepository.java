package ai.cosplay.repository;

import ai.cosplay.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNameIgnoreCase(String name);
    List<Role> findAll();
    Optional<Role> findById(Long id);
}


