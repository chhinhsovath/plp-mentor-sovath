import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function inspectExistingMasterFields() {
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
    console.log('✅ Connected to database\n');

    // Table structure
    console.log('📊 MASTER_FIELDS TABLE STRUCTURE:');
    console.log('==================================');
    console.log('Columns:');
    console.log('- id (integer) - Primary key');
    console.log('- order (integer) - Sort order');
    console.log('- subject (varchar 512) - Subject field');
    console.log('- grade (varchar 512) - Grade level');
    console.log('- level (varchar 512) - Level');
    console.log('- field_type_one (varchar 512)');
    console.log('- field_type_two (varchar 512)');
    console.log('- field_type_three (varchar 512)');
    console.log('- field_type_four (varchar 512)');
    console.log('- activity (varchar 512) - Activity description');
    console.log('- indicator (varchar 512) - Indicator/metric');
    console.log('- note (varchar 512) - Additional notes\n');

    // Get row count
    const countResult = await dataSource.query('SELECT COUNT(*) as count FROM master_fields');
    const totalCount = parseInt(countResult[0].count);
    console.log(`📈 TOTAL RECORDS: ${totalCount}\n`);

    // Analyze data by subject
    console.log('📚 RECORDS BY SUBJECT:');
    const subjectStats = await dataSource.query(`
      SELECT 
        COALESCE(subject, '[No Subject]') as subject,
        COUNT(*) as count
      FROM master_fields
      GROUP BY subject
      ORDER BY count DESC
    `);
    console.table(subjectStats);

    // Analyze data by grade
    console.log('\n🎓 RECORDS BY GRADE:');
    const gradeStats = await dataSource.query(`
      SELECT 
        COALESCE(grade, '[No Grade]') as grade,
        COUNT(*) as count
      FROM master_fields
      GROUP BY grade
      ORDER BY grade
    `);
    console.table(gradeStats);

    // Analyze data by level
    console.log('\n📊 RECORDS BY LEVEL:');
    const levelStats = await dataSource.query(`
      SELECT 
        COALESCE(level, '[No Level]') as level,
        COUNT(*) as count
      FROM master_fields
      GROUP BY level
      ORDER BY level
    `);
    console.table(levelStats);

    // Check field_type columns usage
    console.log('\n🔍 FIELD TYPE COLUMNS USAGE:');
    const fieldTypeUsage = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE field_type_one IS NOT NULL) as field_type_one_used,
        COUNT(*) FILTER (WHERE field_type_two IS NOT NULL) as field_type_two_used,
        COUNT(*) FILTER (WHERE field_type_three IS NOT NULL) as field_type_three_used,
        COUNT(*) FILTER (WHERE field_type_four IS NOT NULL) as field_type_four_used,
        COUNT(*) as total_records
      FROM master_fields
    `);
    console.table(fieldTypeUsage);

    // Sample field_type values
    console.log('\n📝 SAMPLE FIELD TYPE VALUES:');
    const fieldTypeSamples = await dataSource.query(`
      SELECT DISTINCT
        field_type_one,
        field_type_two,
        field_type_three,
        field_type_four
      FROM master_fields
      WHERE field_type_one IS NOT NULL 
         OR field_type_two IS NOT NULL
         OR field_type_three IS NOT NULL
         OR field_type_four IS NOT NULL
      LIMIT 10
    `);
    console.table(fieldTypeSamples);

    // Analyze activity field
    console.log('\n🎯 ACTIVITY FIELD ANALYSIS:');
    const activityStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE activity IS NOT NULL) as with_activity,
        COUNT(*) FILTER (WHERE activity IS NULL) as without_activity,
        COUNT(DISTINCT activity) as unique_activities
      FROM master_fields
    `);
    console.table(activityStats);

    // Sample activities
    console.log('\n📋 SAMPLE ACTIVITIES:');
    const sampleActivities = await dataSource.query(`
      SELECT DISTINCT activity
      FROM master_fields
      WHERE activity IS NOT NULL
      ORDER BY activity
      LIMIT 10
    `);
    console.table(sampleActivities);

    // Analyze indicator field
    console.log('\n📊 INDICATOR FIELD ANALYSIS:');
    const indicatorStats = await dataSource.query(`
      SELECT 
        COUNT(*) FILTER (WHERE indicator IS NOT NULL) as with_indicator,
        COUNT(*) FILTER (WHERE indicator IS NULL) as without_indicator,
        COUNT(DISTINCT indicator) as unique_indicators
      FROM master_fields
    `);
    console.table(indicatorStats);

    // Check for order field usage
    console.log('\n🔢 ORDER FIELD ANALYSIS:');
    const orderStats = await dataSource.query(`
      SELECT 
        MIN("order") as min_order,
        MAX("order") as max_order,
        COUNT(DISTINCT "order") as unique_orders,
        COUNT(*) FILTER (WHERE "order" IS NULL) as null_orders
      FROM master_fields
    `);
    console.table(orderStats);

    // Sample data
    console.log('\n📑 SAMPLE DATA (First 10 records):');
    const sampleData = await dataSource.query(`
      SELECT 
        id,
        "order",
        subject,
        grade,
        level,
        field_type_one,
        activity,
        indicator
      FROM master_fields
      ORDER BY id
      LIMIT 10
    `);
    console.table(sampleData);

    // Check for patterns in the data
    console.log('\n🔍 DATA PATTERNS:');
    
    // Subject-Grade combinations
    console.log('\nSubject-Grade Combinations:');
    const subjectGradeCombos = await dataSource.query(`
      SELECT 
        COALESCE(subject, '[No Subject]') as subject,
        COALESCE(grade, '[No Grade]') as grade,
        COUNT(*) as count
      FROM master_fields
      GROUP BY subject, grade
      ORDER BY count DESC
      LIMIT 15
    `);
    console.table(subjectGradeCombos);

    // Check for null values
    console.log('\n❓ NULL VALUE ANALYSIS:');
    const nullAnalysis = await dataSource.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE subject IS NULL) as null_subject,
        COUNT(*) FILTER (WHERE grade IS NULL) as null_grade,
        COUNT(*) FILTER (WHERE level IS NULL) as null_level,
        COUNT(*) FILTER (WHERE activity IS NULL) as null_activity,
        COUNT(*) FILTER (WHERE indicator IS NULL) as null_indicator,
        COUNT(*) FILTER (WHERE note IS NULL) as null_note
      FROM master_fields
    `);
    console.table(nullAnalysis);

    // Get complete row example
    console.log('\n📄 COMPLETE ROW EXAMPLE:');
    const completeRow = await dataSource.query(`
      SELECT *
      FROM master_fields
      WHERE subject IS NOT NULL 
        AND grade IS NOT NULL
        AND activity IS NOT NULL
        AND indicator IS NOT NULL
      LIMIT 1
    `);
    if (completeRow.length > 0) {
      console.log(JSON.stringify(completeRow[0], null, 2));
    } else {
      console.log('No complete rows found with all main fields filled.');
    }

    await dataSource.destroy();
    console.log('\n✅ Inspection complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

inspectExistingMasterFields();