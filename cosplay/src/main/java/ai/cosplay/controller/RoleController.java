package ai.cosplay.controller;

import ai.cosplay.domain.CreateRoleRequest;
import ai.cosplay.domain.Role;
import ai.cosplay.service.RoleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<Role>> list() {
        return ResponseEntity.ok(roleService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> get(@PathVariable Long id) {
        return roleService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/addrole")
    public ResponseEntity<Role> createRole(@RequestBody CreateRoleRequest request) {
        Role role = roleService.createRole(request);
        return ResponseEntity.ok(role);
    }


}


