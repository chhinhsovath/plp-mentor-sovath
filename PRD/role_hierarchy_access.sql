CREATE TABLE role_hierarchy_access (
  id SERIAL PRIMARY KEY,
  role TEXT,
  can_view TEXT,
  manages TEXT[],
  can_approve_missions BOOLEAN,
  notes TEXT
);

INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Administrator', 'All', '{"Zone", "Provincial", "Department", "Cluster", "Director", "Teacher"}', TRUE, 'Nationwide visibility');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Zone', 'All in Zone', '{"Provincial", "Department", "Cluster", "Director", "Teacher"}', TRUE, 'Regional manager');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Provincial', 'All in Province', '{"Department", "Cluster", "Director", "Teacher"}', TRUE, 'Manages province staff');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Department', 'Department & Cluster', '{"Cluster", "Director", "Teacher"}', FALSE, 'Oversees clusters');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Cluster', 'Cluster staff', '{"Director", "Teacher"}', FALSE, 'Manages multiple schools');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Director', 'Teachers in school', '{"Teacher"}', TRUE, 'Principal-level access');
INSERT INTO role_hierarchy_access (role, can_view, manages, can_approve_missions, notes) VALUES ('Teacher', 'Self only', '{}', FALSE, 'Self check-in, self missions');