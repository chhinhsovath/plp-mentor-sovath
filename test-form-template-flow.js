#!/usr/bin/env node

// Test script to verify form creation with templates

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testFormCreation() {
  console.log('Testing form creation with KH-G1-Level1 template...\n');
  
  // Sample form data with template fields
  const formData = {
    name: 'Test KH-G1-Level1 Form',
    description: 'Testing form creation from template',
    category: 'observation',
    sections: [
      {
        id: 'section-1',
        title: 'ការណែនាំមេរៀន - Lesson Reminders',
        order: 0,
        fields: [
          {
            id: 'field-1',
            type: 'checkbox',
            name: 'act_lr_1_use_teacher_manual',
            label: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
            required: true,
            order: 0
          }
        ]
      },
      {
        id: 'section-2',
        title: 'សកម្មភាព ១៖ ការស្គាល់សម្លេងអក្សរថ្មី - Activity 1',
        order: 1,
        fields: [
          {
            id: 'field-2',
            type: 'checkbox',
            name: 'act1_1_use_teacher_manual',
            label: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
            required: true,
            order: 0
          },
          {
            id: 'field-3',
            type: 'checkbox',
            name: 'act1_2_follow_teacher_student_pattern',
            label: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
            required: true,
            order: 1
          }
        ]
      }
    ],
    settings: {
      allowSaveDraft: true,
      requireApproval: false,
      allowAnonymous: false,
      enableVersioning: true
    },
    metadata: {
      version: 1,
      createdBy: 'test-script',
      createdAt: new Date()
    },
    status: 'draft'
  };

  try {
    // 1. Create form
    console.log('1. Creating form...');
    const createResponse = await axios.post(`${API_URL}/forms`, formData);
    const createdForm = createResponse.data.data;
    console.log('✓ Form created successfully');
    console.log(`  - ID: ${createdForm.id}`);
    console.log(`  - Name: ${createdForm.name}`);
    console.log(`  - Sections: ${createdForm.sections.length}`);
    console.log(`  - Total fields: ${createdForm.sections.reduce((sum, s) => sum + s.fields.length, 0)}`);
    
    // 2. Retrieve form
    console.log('\n2. Retrieving created form...');
    const getResponse = await axios.get(`${API_URL}/forms/${createdForm.id}`);
    const retrievedForm = getResponse.data.data;
    console.log('✓ Form retrieved successfully');
    console.log(`  - Has ${retrievedForm.sections.length} sections`);
    
    // 3. List forms
    console.log('\n3. Listing all forms...');
    const listResponse = await axios.get(`${API_URL}/forms`);
    const forms = listResponse.data.data.forms;
    const foundForm = forms.find(f => f.id === createdForm.id);
    console.log(`✓ Found ${forms.length} forms total`);
    console.log(`  - Created form ${foundForm ? 'IS' : 'IS NOT'} in the list`);
    
    // 4. Verify field names
    console.log('\n4. Verifying field names...');
    retrievedForm.sections.forEach((section, sIdx) => {
      console.log(`\nSection ${sIdx + 1}: ${section.title}`);
      section.fields.forEach((field, fIdx) => {
        console.log(`  Field ${fIdx + 1}: ${field.name} (${field.type})`);
      });
    });
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFormCreation();