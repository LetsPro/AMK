-- Fix client_file_assignments stage FK to reference stages(id) instead of client_project_stages(id)
ALTER TABLE client_file_assignments 
  DROP CONSTRAINT IF EXISTS client_file_assignments_stage_id_fkey;

ALTER TABLE client_file_assignments 
  ADD CONSTRAINT client_file_assignments_stage_id_fkey 
  FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL;

-- Fix client_blueprint_assignments stage FK similarly
ALTER TABLE client_blueprint_assignments 
  DROP CONSTRAINT IF EXISTS client_blueprint_assignments_stage_id_fkey;

ALTER TABLE client_blueprint_assignments 
  ADD CONSTRAINT client_blueprint_assignments_stage_id_fkey 
  FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL;
