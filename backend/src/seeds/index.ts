import { DataSource } from 'typeorm';
import { seedRoleHierarchy } from './role-hierarchy.seed';
import { seedDefaultAdmin } from './default-admin.seed';
import { seedObservationForms } from './observation-forms.seed';
import { seedComprehensiveForms } from './comprehensive-forms.seed';
import { seedDevelopmentUsers } from './development-users.seed';

export async function runSeeds(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  try {
    await seedRoleHierarchy(dataSource);
    await seedDefaultAdmin(dataSource);
    await seedDevelopmentUsers(dataSource);
    await seedObservationForms(dataSource);
    await seedComprehensiveForms(dataSource);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}
