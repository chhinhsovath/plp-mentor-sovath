const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/v1';

// Import template data
const { KH_G1_LEVEL1_ACTIVITIES, KH_G1_LEVEL2_ACTIVITIES, KH_G1_LEVEL3_ACTIVITIES } = require('./frontend/src/data/observationFormTemplates');

async function testFormCreationDirectly() {
  console.log('🚀 Testing form creation with templates via API...\n');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  const templates = [
    { 
      id: 'KH-G1-Level1', 
      name: 'Test KH-G1-Level1 Form',
      activities: KH_G1_LEVEL1_ACTIVITIES
    },
    { 
      id: 'KH-G1-Level2', 
      name: 'Test KH-G1-Level2 Form',
      activities: KH_G1_LEVEL2_ACTIVITIES
    },
    { 
      id: 'KH-G1-Level3', 
      name: 'Test KH-G1-Level3 Form',
      activities: KH_G1_LEVEL3_ACTIVITIES
    }
  ];
  
  for (const template of templates) {
    console.log(`\n=== Testing ${template.id} ===`);
    
    // Build form data from template
    const formData = {
      name: template.name,
      description: `Testing ${template.id} template`,
      category: 'observation',
      sections: template.activities.map((activity, index) => ({
        id: `section-${Date.now()}-${index}`,
        title: activity.title,
        order: activity.order,
        fields: activity.indicators.map((indicator, indIndex) => ({
          id: `field-${Date.now()}-${index}-${indIndex}`,
          type: indicator.rubricType === 'scale' ? 'scale' : 'checkbox',
          name: indicator.fieldName,
          label: indicator.text,
          required: true,
          order: indIndex,
          validation: {
            ...(indicator.rubricType === 'scale' && {
              min: 1,
              max: indicator.maxScore || 3,
            }),
          },
          metadata: {
            indicatorNumber: indicator.number,
            maxScore: indicator.maxScore,
            rubricType: indicator.rubricType,
          },
        })),
      })),
      settings: {
        allowSaveDraft: true,
        requireApproval: false,
        allowAnonymous: false,
        enableVersioning: true
      },
      metadata: {
        version: 1,
        createdBy: 'api-test',
        createdAt: new Date()
      },
      status: 'draft'
    };
    
    // Count expected fields
    const expectedFields = formData.sections.reduce((sum, s) => sum + s.fields.length, 0);
    console.log(`Expected sections: ${formData.sections.length}`);
    console.log(`Expected fields: ${expectedFields}`);
    
    try {
      // 1. Create form
      console.log('\n1. Creating form...');
      const createResponse = await axios.post(`${API_URL}/forms`, formData);
      const createdForm = createResponse.data.data;
      console.log(`✅ Form created with ID: ${createdForm.id}`);
      
      // 2. Retrieve form
      console.log('\n2. Retrieving form...');
      const getResponse = await axios.get(`${API_URL}/forms/${createdForm.id}`);
      const retrievedForm = getResponse.data.data;
      
      // Count actual fields
      const actualSections = retrievedForm.sections.length;
      const actualFields = retrievedForm.sections.reduce((sum, s) => sum + s.fields.length, 0);
      
      console.log(`✅ Form retrieved`);
      console.log(`   Sections: ${actualSections} (expected: ${formData.sections.length})`);
      console.log(`   Fields: ${actualFields} (expected: ${expectedFields})`);
      
      // 3. List all fields with their names
      console.log('\n3. Field details:');
      retrievedForm.sections.forEach((section, sIdx) => {
        console.log(`\n   Section ${sIdx + 1}: ${section.title}`);
        section.fields.forEach((field, fIdx) => {
          console.log(`     Field ${fIdx + 1}: ${field.name} (${field.type})`);
        });
      });
      
      // 4. Test result
      const testPassed = actualSections === formData.sections.length && actualFields === expectedFields;
      
      testResults.tests.push({
        template: template.id,
        formId: createdForm.id,
        status: testPassed ? 'PASSED' : 'FAILED',
        expected: {
          sections: formData.sections.length,
          fields: expectedFields
        },
        actual: {
          sections: actualSections,
          fields: actualFields
        },
        fieldNames: retrievedForm.sections.flatMap(s => s.fields.map(f => f.name))
      });
      
      console.log(`\n${testPassed ? '✅' : '❌'} Test ${testPassed ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      testResults.tests.push({
        template: template.id,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.tests.filter(t => t.status === 'PASSED').length}`);
  console.log(`Failed: ${testResults.tests.filter(t => t.status === 'FAILED').length}`);
  console.log(`Errors: ${testResults.tests.filter(t => t.status === 'ERROR').length}`);
  
  // Save results
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  fs.writeFileSync(
    path.join(resultsDir, 'api-test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  // Generate report
  const report = `
# Form Template API Test Report
Generated: ${testResults.timestamp}

## Summary
- Total tests: ${testResults.tests.length}
- Passed: ${testResults.tests.filter(t => t.status === 'PASSED').length}
- Failed: ${testResults.tests.filter(t => t.status === 'FAILED').length}

## Detailed Results

${testResults.tests.map(test => `
### ${test.template} - ${test.status}
${test.formId ? `- Form ID: ${test.formId}` : ''}
${test.expected ? `- Expected: ${test.expected.sections} sections, ${test.expected.fields} fields` : ''}
${test.actual ? `- Actual: ${test.actual.sections} sections, ${test.actual.fields} fields` : ''}
${test.error ? `- Error: ${test.error}` : ''}

${test.fieldNames ? `#### Fields Created:
${test.fieldNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}` : ''}
`).join('\n')}
`;
  
  fs.writeFileSync(
    path.join(resultsDir, 'api-test-report.md'),
    report
  );
  
  console.log(`\n📊 Test results saved to: ${path.join(resultsDir, 'api-test-report.md')}`);
}

// Run the test
testFormCreationDirectly();