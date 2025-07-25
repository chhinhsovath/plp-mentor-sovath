import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function inspectMasterFields() {
  const configService = new ConfigService();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: parseInt(configService.get('DB_PORT', '5432')),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'password'),
    database: configService.get('DB_NAME', 'mentoring_platform'),
    ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Check if table exists
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'master_fields'
      )
    `);

    if (!tableExists[0].exists) {
      console.log('❌ Table master_fields does not exist');
      return;
    }

    console.log('✅ Table master_fields exists\n');

    // Get table structure
    console.log('📊 TABLE STRUCTURE:');
    console.log('==================');
    const columns = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'master_fields'
      ORDER BY ordinal_position
    `);

    console.table(columns);

    // Get row count
    const countResult = await dataSource.query('SELECT COUNT(*) as count FROM master_fields');
    const totalCount = parseInt(countResult[0].count);
    console.log(`\n📈 TOTAL RECORDS: ${totalCount}`);

    // Get data statistics
    console.log('\n📊 DATA STATISTICS:');
    console.log('===================');

    // Field types distribution
    const fieldTypes = await dataSource.query(`
      SELECT field_type, COUNT(*) as count
      FROM master_fields
      GROUP BY field_type
      ORDER BY count DESC
    `);
    console.log('\n🔤 Field Types Distribution:');
    console.table(fieldTypes);

    // Categories distribution
    const categories = await dataSource.query(`
      SELECT category, COUNT(*) as count
      FROM master_fields
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('\n📁 Categories Distribution:');
    console.table(categories);

    // Active/Inactive status
    const statusCount = await dataSource.query(`
      SELECT is_active, COUNT(*) as count
      FROM master_fields
      GROUP BY is_active
    `);
    console.log('\n✅ Active Status:');
    console.table(statusCount);

    // Required fields count
    const requiredCount = await dataSource.query(`
      SELECT is_required, COUNT(*) as count
      FROM master_fields
      GROUP BY is_required
    `);
    console.log('\n❗ Required Fields:');
    console.table(requiredCount);

    // Sample data (first 10 records)
    console.log('\n📋 SAMPLE DATA (First 10 records):');
    console.log('==================================');
    const sampleData = await dataSource.query(`
      SELECT 
        field_code,
        field_name,
        field_type,
        category,
        label,
        is_required,
        is_active
      FROM master_fields
      ORDER BY sort_order, field_code
      LIMIT 10
    `);
    console.table(sampleData);

    // Fields with options
    console.log('\n🎯 FIELDS WITH OPTIONS:');
    const fieldsWithOptions = await dataSource.query(`
      SELECT 
        field_code,
        field_name,
        field_type,
        jsonb_array_length(options) as option_count
      FROM master_fields
      WHERE options IS NOT NULL
      ORDER BY field_code
    `);
    console.table(fieldsWithOptions);

    // Fields with validation rules
    console.log('\n✔️ FIELDS WITH VALIDATION RULES:');
    const fieldsWithValidation = await dataSource.query(`
      SELECT 
        field_code,
        field_name,
        field_type,
        jsonb_array_length(validation_rules) as rule_count
      FROM master_fields
      WHERE validation_rules IS NOT NULL
      ORDER BY field_code
    `);
    console.table(fieldsWithValidation);

    // Check for multilingual support
    console.log('\n🌐 MULTILINGUAL SUPPORT:');
    const multilingualCount = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE label_km IS NOT NULL) as with_khmer_label,
        COUNT(*) FILTER (WHERE description_km IS NOT NULL) as with_khmer_description,
        COUNT(*) FILTER (WHERE placeholder_km IS NOT NULL) as with_khmer_placeholder,
        COUNT(*) as total_fields
      FROM master_fields
    `);
    console.table(multilingualCount);

    // Complex field types (with metadata)
    console.log('\n🔧 COMPLEX FIELDS (with metadata):');
    const complexFields = await dataSource.query(`
      SELECT 
        field_code,
        field_name,
        field_type,
        CASE 
          WHEN metadata IS NOT NULL THEN jsonb_typeof(metadata)
          ELSE 'none'
        END as metadata_type
      FROM master_fields
      WHERE metadata IS NOT NULL
      ORDER BY field_type, field_code
      LIMIT 20
    `);
    console.table(complexFields);

    // Get unique field codes pattern
    console.log('\n🔍 FIELD CODE PATTERNS:');
    const fieldCodePatterns = await dataSource.query(`
      SELECT 
        SPLIT_PART(field_code, '_', 1) as prefix,
        COUNT(*) as count
      FROM master_fields
      GROUP BY SPLIT_PART(field_code, '_', 1)
      ORDER BY count DESC
    `);
    console.table(fieldCodePatterns);

    // Check for any duplicate field codes
    console.log('\n⚠️  CHECKING FOR DUPLICATES:');
    const duplicates = await dataSource.query(`
      SELECT field_code, COUNT(*) as count
      FROM master_fields
      GROUP BY field_code
      HAVING COUNT(*) > 1
    `);
    if (duplicates.length > 0) {
      console.log('Found duplicate field codes:');
      console.table(duplicates);
    } else {
      console.log('✅ No duplicate field codes found');
    }

    // Get a detailed view of one example from each field type
    console.log('\n📝 EXAMPLE OF EACH FIELD TYPE:');
    const examples = await dataSource.query(`
      WITH ranked_fields AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY field_type ORDER BY sort_order, field_code) as rn
        FROM master_fields
      )
      SELECT 
        field_code,
        field_name,
        field_type,
        category,
        label,
        CASE 
          WHEN options IS NOT NULL THEN jsonb_array_length(options) 
          ELSE 0 
        END as option_count,
        CASE 
          WHEN validation_rules IS NOT NULL THEN jsonb_array_length(validation_rules) 
          ELSE 0 
        END as validation_count,
        metadata IS NOT NULL as has_metadata
      FROM ranked_fields
      WHERE rn = 1
      ORDER BY field_type
    `);
    console.table(examples);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inspectMasterFields();