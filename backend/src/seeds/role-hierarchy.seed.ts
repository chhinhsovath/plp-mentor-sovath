import { DataSource } from 'typeorm';
import { RoleHierarchyAccess } from '../entities/role-hierarchy-access.entity';

export async function seedRoleHierarchy(dataSource: DataSource) {
  const roleHierarchyRepository = dataSource.getRepository(RoleHierarchyAccess);

  // Check if data already exists
  const existingRoles = await roleHierarchyRepository.count();
  if (existingRoles > 0) {
    console.log('Role hierarchy data already exists, skipping seed...');
    return;
  }

  const roleHierarchyData = [
    {
      role: 'Administrator',
      canView: 'All',
      manages: ['Zone', 'Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      notes: 'Nationwide visibility',
    },
    {
      role: 'Zone',
      canView: 'All in Zone',
      manages: ['Provincial', 'Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      notes: 'Regional manager',
    },
    {
      role: 'Provincial',
      canView: 'All in Province',
      manages: ['Department', 'Cluster', 'Director', 'Teacher'],
      canApproveMissions: true,
      notes: 'Manages province staff',
    },
    {
      role: 'Department',
      canView: 'Department & Cluster',
      manages: ['Cluster', 'Director', 'Teacher'],
      canApproveMissions: false,
      notes: 'Oversees clusters',
    },
    {
      role: 'Cluster',
      canView: 'Cluster staff',
      manages: ['Director', 'Teacher'],
      canApproveMissions: false,
      notes: 'Manages multiple schools',
    },
    {
      role: 'Director',
      canView: 'Teachers in school',
      manages: ['Teacher'],
      canApproveMissions: true,
      notes: 'Principal-level access',
    },
    {
      role: 'Teacher',
      canView: 'Self only',
      manages: [],
      canApproveMissions: false,
      notes: 'Self check-in, self missions',
    },
  ];

  console.log('Seeding role hierarchy data...');

  for (const roleData of roleHierarchyData) {
    const roleHierarchy = roleHierarchyRepository.create(roleData);
    await roleHierarchyRepository.save(roleHierarchy);
    console.log(`✅ Created role hierarchy for: ${roleData.role}`);
  }

  console.log('Role hierarchy seeding completed!');
}
