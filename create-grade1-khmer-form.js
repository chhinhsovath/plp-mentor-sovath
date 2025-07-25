const axios = require('axios');

async function createGrade1KhmerForm() {
  const API_URL = 'http://localhost:3000/api/v1/forms';
  
  const formData = {
    name: 'ឧបករណ៍សង្កេតគ្រូថ្នាក់ទី១ - មុខវិជ្ជាភាសាខ្មែរ',
    nameKm: 'ឧបករណ៍សង្កេតគ្រូថ្នាក់ទី១ - មុខវិជ្ជាភាសាខ្មែរ',
    description: 'Teacher Observation Tool for Grade 1 - Khmer Subject',
    descriptionKm: 'ឧបករណ៍សម្រាប់សង្កេតការបង្រៀនរបស់គ្រូថ្នាក់ទី១ មុខវិជ្ជាភាសាខ្មែរ',
    category: 'observation',
    status: 'published',
    settings: {
      allowSaveDraft: true,
      requireApproval: false,
      enableVersioning: true
    },
    sections: [
      {
        id: 'header-info',
        title: 'ព័ត៌មានទូទៅ',
        titleKm: 'ព័ត៌មានទូទៅ',
        fields: [
          {
            id: 'province',
            type: 'text',
            label: 'Province',
            labelKm: 'រាជធានី/ខេត្ត',
            required: true
          },
          {
            id: 'district',
            type: 'text',
            label: 'District',
            labelKm: 'ស្រុក/ខណ្ឌ',
            required: true
          },
          {
            id: 'school',
            type: 'text',
            label: 'School',
            labelKm: 'សាលារៀន',
            required: true
          },
          {
            id: 'teacher_name',
            type: 'text',
            label: 'Teacher Name',
            labelKm: 'ឈ្មោះគ្រូ',
            required: true
          },
          {
            id: 'observer_name',
            type: 'text',
            label: 'Observer Name',
            labelKm: 'ឈ្មោះអ្នកសង្កេត',
            required: true
          },
          {
            id: 'date',
            type: 'date',
            label: 'Date',
            labelKm: 'ថ្ងៃទី',
            required: true
          },
          {
            id: 'total_students',
            type: 'number',
            label: 'Total Students',
            labelKm: 'ចំនួនសិស្សាសរុប',
            required: true
          },
          {
            id: 'present_students',
            type: 'number',
            label: 'Present Students',
            labelKm: 'ចំនួនសិស្សមកសិក្សា',
            required: true
          }
        ]
      },
      {
        id: 'section1-lesson-intro',
        title: 'សកម្មភាពទី១៖ ការណែនាំមេរៀនថ្មី',
        titleKm: 'សកម្មភាពទី១៖ ការណែនាំមេរៀនថ្មី',
        fields: [
          {
            id: 'activity1-teacher-ask',
            type: 'radio',
            label: 'Does the teacher ask questions to students about the lesson theme?',
            labelKm: 'តើគ្រូសាសួរសំណួរទៅកាន់សិស្សាអំពីប្រធានបទមេរៀន ឬទេ?',
            options: [
              { value: 'yes', label: 'Yes', labelKm: 'មាន' },
              { value: 'no', label: 'No', labelKm: 'គ្មាន' }
            ],
            required: true
          },
          {
            id: 'activity1-teacher-explain',
            type: 'radio',
            label: 'Does the teacher explain learning objectives clearly?',
            labelKm: 'តើគ្រូពន្យល់វត្ថុបំណងសិក្សាច្បាស់លាស់ ឬទេ?',
            options: [
              { value: 'yes', label: 'Yes', labelKm: 'ច្បាស់លាស់' },
              { value: 'no', label: 'No', labelKm: 'មិនច្បាស់លាស់' }
            ],
            required: true
          },
          {
            id: 'activity1-student-understand',
            type: 'radio',
            label: 'Do students understand the learning objectives?',
            labelKm: 'តើសិស្សយល់ពីវត្ថុបំណងសិក្សា ឬទេ?',
            options: [
              { value: 'yes', label: 'Yes', labelKm: 'យល់' },
              { value: 'no', label: 'No', labelKm: 'មិនយល់' }
            ],
            required: true
          },
          {
            id: 'activity1-notes',
            type: 'textarea',
            label: 'Notes',
            labelKm: 'កំណត់ចំណាំ',
            required: false
          }
        ]
      },
      {
        id: 'section2-lesson-activities', 
        title: 'សកម្មភាពទី២៖ ការសាកល្បង/សកម្មភាព',
        titleKm: 'សកម្មភាពទី២៖ ការសាកល្បង/សកម្មភាព',
        fields: [
          {
            id: 'activity2-item1',
            type: 'checkbox',
            label: 'Teacher prepares lesson materials',
            labelKm: 'គ្រូរៀបចំសម្ភារៈមេរៀន',
            required: false
          },
          {
            id: 'activity2-item2',
            type: 'checkbox',
            label: 'Teacher asks students to read',
            labelKm: 'គ្រូឱ្យសិស្សអាន',
            required: false
          },
          {
            id: 'activity2-item3',
            type: 'checkbox',
            label: 'Teacher guides reading',
            labelKm: 'គ្រូដឹកនាំការអាន',
            required: false
          },
          {
            id: 'activity2-item4',
            type: 'checkbox',
            label: 'Teacher asks comprehension questions',
            labelKm: 'គ្រូសួរសំណួរយល់អត្ថន័យ',
            required: false
          },
          {
            id: 'activity2-item5',
            type: 'checkbox',
            label: 'Teacher uses vocabulary',
            labelKm: 'គ្រូប្រើពាក្យ',
            required: false
          },
          {
            id: 'activity2-item6',
            type: 'checkbox',
            label: 'Teacher uses sentences',
            labelKm: 'គ្រូប្រើប្រយោគ',
            required: false
          },
          {
            id: 'activity2-item7',
            type: 'checkbox',
            label: 'Teacher lets students practice',
            labelKm: 'គ្រូឱ្យសិស្សហាត់',
            required: false
          },
          {
            id: 'activity2-item8',
            type: 'checkbox',
            label: 'Teacher follows up',
            labelKm: 'គ្រូតាមដាន',
            required: false
          },
          {
            id: 'activity2-notes',
            type: 'textarea',
            label: 'Notes',
            labelKm: 'កំណត់ចំណាំ',
            required: false
          }
        ]
      },
      {
        id: 'section3-student-practice',
        title: 'សកម្មភាពទី៣៖ ការអនុវត្ត',
        titleKm: 'សកម្មភាពទី៣៖ ការអនុវត្ត',
        fields: [
          {
            id: 'activity3-phase',
            type: 'select',
            label: 'Activity Phase',
            labelKm: 'ដំណាក់កាល',
            options: [
              { value: 'modeling', label: 'Teacher Modeling', labelKm: 'គ្រូធ្វើគំរូ' },
              { value: 'guided', label: 'Guided Practice', labelKm: 'ដឹកនាំការអនុវត្ត' },
              { value: 'independent', label: 'Independent Practice', labelKm: 'អនុវត្តដោយខ្លួនឯង' }
            ],
            required: true
          },
          {
            id: 'activity3-student-activities',
            type: 'checkbox_group',
            label: 'Student Activities',
            labelKm: 'សកម្មភាពសិស្ស',
            options: [
              { value: 'read_together', label: 'Read together', labelKm: 'អានរួមគ្នា' },
              { value: 'read_individual', label: 'Read individually', labelKm: 'អានម្នាក់ៗ' },
              { value: 'write', label: 'Write', labelKm: 'សរសេរ' },
              { value: 'discuss', label: 'Discuss', labelKm: 'ពិភាក្សា' },
              { value: 'practice', label: 'Practice', labelKm: 'អនុវត្ត' }
            ],
            required: false
          },
          {
            id: 'activity3-notes',
            type: 'textarea',
            label: 'Notes',
            labelKm: 'កំណត់ចំណាំ',
            required: false
          }
        ]
      },
      {
        id: 'section4-summary',
        title: 'ផ្នែកសរុប',
        titleKm: 'ផ្នែកសរុប',
        fields: [
          {
            id: 'question1',
            type: 'textarea',
            label: 'What are 1-2 things the teacher did well?',
            labelKm: 'តើអ្វីខ្លះជាចំណុចខ្លាំង ១-២ ឬបីរបស់គ្រូក្នុងការបង្រៀន?',
            required: true
          },
          {
            id: 'question2',
            type: 'textarea',
            label: 'What are 1-2 things that need improvement?',
            labelKm: 'តើអ្វីខ្លះជាចំណុចដែលគ្រូត្រូវកែលម្អ?',
            required: true
          },
          {
            id: 'student_scores',
            type: 'score_table',
            label: 'Student Assessment Scores',
            labelKm: 'ពិន្ទុវាយតម្លៃសិស្ស',
            columns: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            rows: [
              { id: 'good', label: 'Good', labelKm: 'ល្អ' },
              { id: 'medium', label: 'Medium', labelKm: 'មធ្យម' },
              { id: 'weak', label: 'Weak', labelKm: 'ខ្សោយ' }
            ],
            required: true
          },
          {
            id: 'boy_scores',
            type: 'score_table',
            label: 'Boy Student Scores',
            labelKm: 'សិស្សប្រុស',
            columns: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            rows: [
              { id: 'good', label: 'Good', labelKm: 'ល្អ' },
              { id: 'medium', label: 'Medium', labelKm: 'មធ្យម' },
              { id: 'weak', label: 'Weak', labelKm: 'ខ្សោយ' }
            ],
            required: false
          },
          {
            id: 'girl_scores',
            type: 'score_table',
            label: 'Girl Student Scores',
            labelKm: 'សិស្សស្រី',
            columns: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            rows: [
              { id: 'good', label: 'Good', labelKm: 'ល្អ' },
              { id: 'medium', label: 'Medium', labelKm: 'មធ្យម' },
              { id: 'weak', label: 'Weak', labelKm: 'ខ្សោយ' }
            ],
            required: false
          },
          {
            id: 'signatures',
            type: 'signature_fields',
            label: 'Signatures',
            labelKm: 'ហត្ថលេខា',
            fields: [
              { id: 'observer', label: 'Observer', labelKm: 'អ្នកសង្កេត' },
              { id: 'teacher', label: 'Teacher', labelKm: 'គ្រូបង្រៀន' },
              { id: 'director', label: 'School Director', labelKm: 'នាយកសាលា' }
            ],
            required: false
          }
        ]
      }
    ],
    metadata: {
      createdBy: 'system',
      version: '1.0',
      subject: 'Khmer',
      grade: '1',
      formCode: 'G1-KH-OBS'
    }
  };

  try {
    console.log('Creating Grade 1 Khmer observation form...');
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (process.env.AUTH_TOKEN || 'test-token')
      }
    });

    console.log('✅ Form created successfully!');
    console.log('Form ID:', response.data.data.id);
    console.log('Form Name:', response.data.data.name);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating form:', error.response?.data || error.message);
    throw error;
  }
}

// Run the function
createGrade1KhmerForm()
  .then(form => {
    console.log('\nForm creation completed!');
    console.log('You can now view this form in the forms list.');
  })
  .catch(error => {
    console.error('\nForm creation failed:', error);
    process.exit(1);
  });