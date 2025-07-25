#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api/v1';

// Template field configurations
const templates = {
  'KH-G1-Level1': {
    name: 'Test KH-G1-Level1 Form',
    fields: [
      "act_lr_1_use_teacher_manual",
      "act1_1_use_teacher_manual",
      "act1_2_follow_teacher_student_pattern",
      "act1_3_comply_with_deadline",
      "act2_1_use_teacher_manual",
      "act2_2_follow_teacher_student_pattern",
      "act2_3_walk_around_check_student_work",
      "act3b_1_index_finger_reading",
      "act4_1_use_teacher_manual",
      "act4_2_follow_teacher_student_pattern",
      "act4_3_comply_with_deadline",
      "act4_4_walk_around_check_student_work",
      "act5_1_index_finger_reading",
      "act6_1_use_teacher_manual",
      "act6_2_follow_teacher_student_pattern",
      "act6_3_comply_with_deadline",
      "act6_4_index_finger_reading",
      "act6_5_walk_around_check_student_work",
      "act7_1_use_teacher_manual",
      "act7_2_follow_teacher_student_pattern",
      "act7_3_comply_with_deadline",
      "act7_4_walk_around_check_student_work"
    ]
  },
  'KH-G1-Level2': {
    name: 'Test KH-G1-Level2 Form',
    fields: [
      "act1_1_follow_teacher_student_pattern",
      "act1_2_observe_students_attention",
      "act2_1_follow_teacher_student_pattern",
      "act2_2_observe_students_attention",
      "act3a_1_observe_students_attention",
      "act3b_1_observe_students_attention",
      "act4_1_observe_students_attention",
      "act5_1_observe_students_attention",
      "act6_1_observe_students_attention",
      "act6_2_practice_by_group_or_pair",
      "act7_1_observe_students_attention",
      "act7_2_practice_by_group_or_pair"
    ]
  },
  'KH-G1-Level3': {
    name: 'Test KH-G1-Level3 Form',
    fields: [
      "act1_1_encourage_struggling_students",
      "act2_1_encourage_struggling_students",
      "act3a_1_encourage_struggling_students",
      "act3b_1_encourage_struggling_students",
      "act4_1_encourage_struggling_students",
      "act5_1_encourage_struggling_students",
      "act6_1_encourage_struggling_students",
      "act6_2_ask_students_to_explain",
      "act7_1_encourage_struggling_students",
      "act7_2_ask_students_to_explain",
      "act7_3_connect_learning_to_real_life"
    ]
  }
};

async function testFormTemplates() {
  console.log('=== FORM TEMPLATE COMPREHENSIVE TEST ===\n');
  console.log('Testing all three templates with full CRUD operations\n');
  
  const testReport = {
    timestamp: new Date().toISOString(),
    environment: {
      apiUrl: API_URL,
      nodeVersion: process.version
    },
    results: []
  };
  
  for (const [templateId, template] of Object.entries(templates)) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing ${templateId}`);
    console.log(`${'='.repeat(50)}`);
    
    const testResult = {
      template: templateId,
      tests: {}
    };
    
    try {
      // 1. CREATE - Create form with template fields
      console.log('\n1. CREATE: Creating form with template fields...');
      
      const formData = {
        name: template.name,
        description: `Comprehensive test of ${templateId} template`,
        category: 'observation',
        sections: [{
          id: 'section-1',
          title: `${templateId} Indicators`,
          order: 0,
          fields: template.fields.map((fieldName, index) => ({
            id: `field-${Date.now()}-${index}`,
            type: 'checkbox',
            name: fieldName,
            label: `Indicator for ${fieldName}`,
            required: true,
            order: index
          }))
        }],
        settings: {
          allowSaveDraft: true,
          requireApproval: false,
          enableVersioning: true
        },
        metadata: {
          version: 1,
          createdBy: 'test-script',
          createdAt: new Date()
        },
        status: 'draft'
      };
      
      const createResponse = await axios.post(`${API_URL}/forms`, formData);
      const createdForm = createResponse.data.data;
      
      testResult.tests.create = {
        status: 'PASSED',
        formId: createdForm.id,
        fieldsCreated: createdForm.sections[0].fields.length,
        expectedFields: template.fields.length
      };
      
      console.log(`✅ Form created: ${createdForm.id}`);
      console.log(`   Fields: ${createdForm.sections[0].fields.length}/${template.fields.length}`);
      
      // 2. READ - Retrieve and verify form
      console.log('\n2. READ: Retrieving form...');
      
      const getResponse = await axios.get(`${API_URL}/forms/${createdForm.id}`);
      const retrievedForm = getResponse.data.data;
      
      const retrievedFieldNames = retrievedForm.sections[0].fields.map(f => f.name);
      const allFieldsPresent = template.fields.every(f => retrievedFieldNames.includes(f));
      
      testResult.tests.read = {
        status: allFieldsPresent ? 'PASSED' : 'FAILED',
        fieldsRetrieved: retrievedFieldNames.length,
        allFieldsPresent,
        missingFields: template.fields.filter(f => !retrievedFieldNames.includes(f))
      };
      
      console.log(`${allFieldsPresent ? '✅' : '❌'} Form retrieved`);
      console.log(`   All fields present: ${allFieldsPresent}`);
      if (!allFieldsPresent) {
        console.log(`   Missing fields:`, testResult.tests.read.missingFields);
      }
      
      // 3. UPDATE - Update form name
      console.log('\n3. UPDATE: Updating form...');
      
      const updatedName = `${template.name} (Updated)`;
      const updateResponse = await axios.put(`${API_URL}/forms/${createdForm.id}`, {
        ...retrievedForm,
        name: updatedName
      });
      
      testResult.tests.update = {
        status: updateResponse.data.success ? 'PASSED' : 'FAILED',
        updatedName
      };
      
      console.log(`${updateResponse.data.success ? '✅' : '❌'} Form updated`);
      
      // 4. LIST - Verify form appears in list
      console.log('\n4. LIST: Checking forms list...');
      
      const listResponse = await axios.get(`${API_URL}/forms`);
      const formsList = listResponse.data.data.forms;
      const formInList = formsList.find(f => f.id === createdForm.id);
      
      testResult.tests.list = {
        status: formInList ? 'PASSED' : 'FAILED',
        totalForms: formsList.length,
        formFound: !!formInList
      };
      
      console.log(`${formInList ? '✅' : '❌'} Form found in list`);
      console.log(`   Total forms: ${formsList.length}`);
      
      // 5. OPERATIONS - Test form operations
      console.log('\n5. OPERATIONS: Testing form operations...');
      
      // Publish
      try {
        await axios.post(`${API_URL}/forms/${createdForm.id}/publish`);
        testResult.tests.publish = { status: 'PASSED' };
        console.log('✅ Publish operation successful');
      } catch (e) {
        testResult.tests.publish = { status: 'FAILED', error: e.message };
        console.log('❌ Publish operation failed');
      }
      
      // Archive
      try {
        await axios.post(`${API_URL}/forms/${createdForm.id}/archive`);
        testResult.tests.archive = { status: 'PASSED' };
        console.log('✅ Archive operation successful');
      } catch (e) {
        testResult.tests.archive = { status: 'FAILED', error: e.message };
        console.log('❌ Archive operation failed');
      }
      
      // 6. DELETE - Delete the form
      console.log('\n6. DELETE: Deleting form...');
      
      try {
        await axios.delete(`${API_URL}/forms/${createdForm.id}`);
        testResult.tests.delete = { status: 'PASSED' };
        console.log('✅ Form deleted');
      } catch (e) {
        testResult.tests.delete = { status: 'FAILED', error: e.message };
        console.log('❌ Delete operation failed');
      }
      
      // Summary for this template
      const passedTests = Object.values(testResult.tests).filter(t => t.status === 'PASSED').length;
      const totalTests = Object.keys(testResult.tests).length;
      
      console.log(`\n${templateId} Summary: ${passedTests}/${totalTests} tests passed`);
      
    } catch (error) {
      console.error(`\n❌ Test failed for ${templateId}:`, error.message);
      testResult.error = error.message;
    }
    
    testReport.results.push(testResult);
  }
  
  // Overall summary
  console.log('\n' + '='.repeat(50));
  console.log('OVERALL TEST SUMMARY');
  console.log('='.repeat(50));
  
  let totalPassed = 0;
  let totalTests = 0;
  
  testReport.results.forEach(result => {
    if (result.tests) {
      const passed = Object.values(result.tests).filter(t => t.status === 'PASSED').length;
      const total = Object.keys(result.tests).length;
      totalPassed += passed;
      totalTests += total;
      console.log(`${result.template}: ${passed}/${total} tests passed`);
    }
  });
  
  console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed`);
  
  // Save detailed report
  const reportDir = path.join(__dirname, 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const reportPath = path.join(reportDir, `form-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
  
  // Generate markdown report
  const markdownReport = `# Form Template Test Report
Generated: ${testReport.timestamp}

## Summary
- Total Templates Tested: ${testReport.results.length}
- Total Tests Passed: ${totalPassed}/${totalTests}

## Detailed Results

${testReport.results.map(result => `
### ${result.template}
${result.error ? `❌ Error: ${result.error}` : ''}

${result.tests ? Object.entries(result.tests).map(([testName, test]) => `
#### ${testName.toUpperCase()}: ${test.status}
${Object.entries(test)
  .filter(([k]) => k !== 'status')
  .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
  .join('\n')}
`).join('\n') : 'No tests completed'}
`).join('\n')}

## Field Verification

${testReport.results.map(result => `
### ${result.template}
${result.tests && result.tests.create ? `
Expected fields: ${result.tests.create.expectedFields}
Created fields: ${result.tests.create.fieldsCreated}
${result.tests.read && !result.tests.read.allFieldsPresent ? `Missing fields: ${result.tests.read.missingFields.join(', ')}` : 'All fields present ✅'}
` : 'No field data'}
`).join('\n')}
`;
  
  const markdownPath = path.join(reportDir, `form-test-report-${Date.now()}.md`);
  fs.writeFileSync(markdownPath, markdownReport);
  
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  console.log(`📄 Markdown report saved to: ${markdownPath}`);
  
  // Return exit code based on test results
  process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run the tests
testFormTemplates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});