import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { seedDevelopmentUsers } from './src/seeds/development-users.seed'

// Load environment variables
dotenv.config()

// Create a data source for seeding
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'plp_mentoring',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [join(__dirname, 'src/entities/**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: true,
})

async function seedDevUsers() {
  try {
    console.log('🔌 Connecting to database...')
    await AppDataSource.initialize()
    console.log('✅ Database connected!')

    console.log('🌱 Seeding development users...')
    await seedDevelopmentUsers(AppDataSource)

    console.log('✅ Development users seeded successfully!')
    console.log('\n📋 You can now login with:')
    console.log('   Username: chhinhs')
    console.log('   Password: password')
    console.log('   Role: Administrator')
    
    await AppDataSource.destroy()
  } catch (error) {
    console.error('❌ Error seeding development users:', error)
    process.exit(1)
  }
}

seedDevUsers()