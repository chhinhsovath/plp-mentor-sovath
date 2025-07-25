import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';

export async function seedDefaultAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('Default admin user already exists, skipping seed...');
    return;
  }

  console.log('Creating default admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = userRepository.create({
    username: 'admin',
    email: 'admin@moeys.gov.kh',
    password: hashedPassword,
    fullName: 'System Administrator',
    role: UserRole.ADMINISTRATOR,
    locationScope: 'National',
    isActive: true,
  });

  await userRepository.save(adminUser);
  console.log('✅ Default admin user created successfully!');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   Email: admin@moeys.gov.kh');
}
