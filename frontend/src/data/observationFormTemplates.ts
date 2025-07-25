// Predefined observation form templates based on the Grade 1 Khmer observation tool

export interface ObservationIndicator {
  id: string;
  number: string;
  text: string;
  fieldName: string; // Database field name
  rubricType: 'scale' | 'checkbox';
  maxScore?: number;
  scales?: {
    value: number;
    label: string;
    description: string;
  }[];
}

export interface ObservationActivity {
  id: string;
  code: string; // Activity code for database (ACT_LR, ACT1, etc.)
  number: string;
  title: string;
  order: number;
  indicators: ObservationIndicator[];
}

// KH-G1-Level1 Template Activities based on the official observation form
export const KH_G1_LEVEL1_ACTIVITIES: ObservationActivity[] = [
  {
    id: 'lesson-reminders',
    code: 'ACT_LR',
    number: '1',
    title: 'ការណែនាំមេរៀន - Lesson Reminders',
    order: 1,
    indicators: [
      {
        id: 'lr-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act_lr_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-1',
    code: 'ACT1',
    number: '2.1',
    title: 'សកម្មភាព ១៖ ការស្គាល់សម្លេងអក្សរថ្មី - Activity 1: Recognition of new phonetics',
    order: 2,
    indicators: [
      {
        id: 'act1-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act1_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act1-follow-pattern',
        number: '២',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act1_2_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act1-comply-deadline',
        number: '៣',
        text: 'អនុវត្តតាមពេលវេលាកំណត់ដែរឬទេ?',
        fieldName: 'act1_3_comply_with_deadline',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-2',
    code: 'ACT2',
    number: '2.2',
    title: 'សកម្មភាព ២៖ ការស្គាល់ចំណុចអក្សរថ្មី - Activity 2: Getting to know new characters',
    order: 3,
    indicators: [
      {
        id: 'act2-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act2_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act2-follow-pattern',
        number: '២',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act2_2_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act2-walk-around',
        number: '៣',
        text: 'ដើរជុំវិញក្នុងថ្នាក់ ពិនិត្យការសរសេរឬអានរបស់សិស្សដែរឬទេ?',
        fieldName: 'act2_3_walk_around_check_student_work',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-3a',
    code: 'ACT3A',
    number: '2.3',
    title: 'សកម្មភាព ៣ក៖ ការអានព្យាង្គ - Activity 3a: Syllable reading',
    order: 4,
    indicators: []
  },
  {
    id: 'activity-3b',
    code: 'ACT3B',
    number: '2.4',
    title: 'សកម្មភាព ៣ខ៖ ការអានពាក្យ - Activity 3b: Word Reading',
    order: 5,
    indicators: [
      {
        id: 'act3b-finger-reading',
        number: '១',
        text: 'ឲ្យសិស្សប្រើម្រាមដៃនាំអានថ្លែងតាមពីក្រោមឡើងលើដែរឬទេ?',
        fieldName: 'act3b_1_index_finger_reading',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-4',
    code: 'ACT4',
    number: '2.5',
    title: 'សកម្មភាព ៤៖ វណ្ណយុត្តិ - Activity 4: Vocabulary',
    order: 6,
    indicators: [
      {
        id: 'act4-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act4_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act4-follow-pattern',
        number: '២',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act4_2_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act4-comply-deadline',
        number: '៣',
        text: 'អនុវត្តតាមពេលវេលាកំណត់ដែរឬទេ?',
        fieldName: 'act4_3_comply_with_deadline',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act4-walk-around',
        number: '៤',
        text: 'ដើរជុំវិញក្នុងថ្នាក់ ពិនិត្យការសរសេរឬអានរបស់សិស្សដែរឬទេ?',
        fieldName: 'act4_4_walk_around_check_student_work',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-5',
    code: 'ACT5',
    number: '2.6',
    title: 'សកម្មភាព ៥៖ ការអានមេរៀន (មិនរាប់បញ្ចូលនៅក្នុងមេរៀនស្ពាន) - Activity 5: Reading the Lesson (not included in the Bridge lesson)',
    order: 7,
    indicators: [
      {
        id: 'act5-finger-reading',
        number: '១',
        text: 'ឲ្យសិស្សប្រើម្រាមដៃនាំអានថ្លែងតាមពីក្រោមឡើងលើដែរឬទេ?',
        fieldName: 'act5_1_index_finger_reading',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-6',
    code: 'ACT6',
    number: '2.7',
    title: 'សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី - Activity 6: Reading Short Articles',
    order: 8,
    indicators: [
      {
        id: 'act6-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act6_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-follow-pattern',
        number: '២',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act6_2_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-comply-deadline',
        number: '៣',
        text: 'អនុវត្តតាមពេលវេលាកំណត់ដែរឬទេ?',
        fieldName: 'act6_3_comply_with_deadline',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-finger-reading',
        number: '៤',
        text: 'ឲ្យសិស្សប្រើម្រាមដៃនាំអានថ្លែងតាមពីក្រោមឡើងលើដែរឬទេ?',
        fieldName: 'act6_4_index_finger_reading',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-walk-around',
        number: '៥',
        text: 'ដើរជុំវិញក្នុងថ្នាក់ ពិនិត្យការសរសេរឬអានរបស់សិស្សដែរឬទេ?',
        fieldName: 'act6_5_walk_around_check_student_work',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-7',
    code: 'ACT7',
    number: '2.8',
    title: 'សកម្មភាព ៧៖ ការសរសេរ - Activity 7: Writing',
    order: 9,
    indicators: [
      {
        id: 'act7-use-manual',
        number: '១',
        text: 'តើគ្រូប្រើសៀវភៅណែនាំគ្រូ(ដំណាក់កាលសកម្មភាពបង្រៀននីមួយៗ)ដែរឬទេ?',
        fieldName: 'act7_1_use_teacher_manual',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-follow-pattern',
        number: '២',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act7_2_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-comply-deadline',
        number: '៣',
        text: 'អនុវត្តតាមពេលវេលាកំណត់ដែរឬទេ?',
        fieldName: 'act7_3_comply_with_deadline',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-walk-around',
        number: '៤',
        text: 'ដើរជុំវិញក្នុងថ្នាក់ ពិនិត្យការសរសេរឬអានរបស់សិស្សដែរឬទេ?',
        fieldName: 'act7_4_walk_around_check_student_work',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  }
];

// KH-G1-Level2 Template Activities
export const KH_G1_LEVEL2_ACTIVITIES: ObservationActivity[] = [
  {
    id: 'activity-1',
    code: 'ACT1',
    number: '1',
    title: 'សកម្មភាព ១៖ ការស្គាល់សម្លេងអក្សរថ្មី - Activity 1: Recognition of new phonetics',
    order: 1,
    indicators: [
      {
        id: 'act1-follow-pattern',
        number: '១',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act1_1_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act1-observe-attention',
        number: '២',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act1_2_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-2',
    code: 'ACT2',
    number: '2',
    title: 'សកម្មភាព ២៖ ការស្គាល់ចំណុចអក្សរថ្មី - Activity 2: Getting to know new characters',
    order: 2,
    indicators: [
      {
        id: 'act2-follow-pattern',
        number: '១',
        text: 'តើគ្រូអនុវត្តតាមគំរូគ្រូនិងសិស្សធ្វើ សិស្សធ្វើរួមគ្នា សិស្សធ្វើម្នាក់ៗដែរឬទេ?',
        fieldName: 'act2_1_follow_teacher_student_pattern',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act2-observe-attention',
        number: '២',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act2_2_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-3a',
    code: 'ACT3A',
    number: '3',
    title: 'សកម្មភាព ៣ក៖ ការអានព្យាង្គ - Activity 3a: Syllable reading',
    order: 3,
    indicators: [
      {
        id: 'act3a-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act3a_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-3b',
    code: 'ACT3B',
    number: '4',
    title: 'សកម្មភាព ៣ខ៖ ការអានពាក្យ - Activity 3b: Word Reading',
    order: 4,
    indicators: [
      {
        id: 'act3b-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act3b_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-4',
    code: 'ACT4',
    number: '5',
    title: 'សកម្មភាព ៤៖ វណ្ណយុត្តិ - Activity 4: Vocabulary',
    order: 5,
    indicators: [
      {
        id: 'act4-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act4_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-5',
    code: 'ACT5',
    number: '6',
    title: 'សកម្មភាព ៥៖ ការអានមេរៀន - Activity 5: Reading the Lesson',
    order: 6,
    indicators: [
      {
        id: 'act5-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act5_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-6',
    code: 'ACT6',
    number: '7',
    title: 'សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី - Activity 6: Reading Short Articles',
    order: 7,
    indicators: [
      {
        id: 'act6-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act6_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-practice-group',
        number: '២',
        text: 'អនុវត្តដោយក្រុម ឬជាគូ',
        fieldName: 'act6_2_practice_by_group_or_pair',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-7',
    code: 'ACT7',
    number: '8',
    title: 'សកម្មភាព ៧៖ ការសរសេរ - Activity 7: Writing',
    order: 8,
    indicators: [
      {
        id: 'act7-observe-attention',
        number: '១',
        text: 'សង្កេតមើលការយកចិត្តទុកដាក់របស់សិស្ស',
        fieldName: 'act7_1_observe_students_attention',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-practice-group',
        number: '២',
        text: 'អនុវត្តដោយក្រុម ឬជាគូ',
        fieldName: 'act7_2_practice_by_group_or_pair',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  }
];

// KH-G1-Level3 Template Activities
export const KH_G1_LEVEL3_ACTIVITIES: ObservationActivity[] = [
  {
    id: 'activity-1',
    code: 'ACT1',
    number: '1',
    title: 'សកម្មភាព ១៖ ការស្គាល់សម្លេងអក្សរថ្មី - Activity 1: Recognition of new phonetics',
    order: 1,
    indicators: [
      {
        id: 'act1-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act1_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-2',
    code: 'ACT2',
    number: '2',
    title: 'សកម្មភាព ២៖ ការស្គាល់ចំណុចអក្សរថ្មី - Activity 2: Getting to know new characters',
    order: 2,
    indicators: [
      {
        id: 'act2-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act2_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-3a',
    code: 'ACT3A',
    number: '3',
    title: 'សកម្មភាព ៣ក៖ ការអានព្យាង្គ - Activity 3a: Syllable reading',
    order: 3,
    indicators: [
      {
        id: 'act3a-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act3a_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-3b',
    code: 'ACT3B',
    number: '4',
    title: 'សកម្មភាព ៣ខ៖ ការអានពាក្យ - Activity 3b: Word Reading',
    order: 4,
    indicators: [
      {
        id: 'act3b-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act3b_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-4',
    code: 'ACT4',
    number: '5',
    title: 'សកម្មភាព ៤៖ វណ្ណយុត្តិ - Activity 4: Vocabulary',
    order: 5,
    indicators: [
      {
        id: 'act4-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act4_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-5',
    code: 'ACT5',
    number: '6',
    title: 'សកម្មភាព ៥៖ ការអានមេរៀន - Activity 5: Reading the Lesson',
    order: 6,
    indicators: [
      {
        id: 'act5-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act5_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-6',
    code: 'ACT6',
    number: '7',
    title: 'សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី - Activity 6: Reading Short Articles',
    order: 7,
    indicators: [
      {
        id: 'act6-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act6_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act6-ask-explain',
        number: '២',
        text: 'សុំឲ្យសិស្សពន្យល់',
        fieldName: 'act6_2_ask_students_to_explain',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  },
  {
    id: 'activity-7',
    code: 'ACT7',
    number: '8',
    title: 'សកម្មភាព ៧៖ ការសរសេរ - Activity 7: Writing',
    order: 8,
    indicators: [
      {
        id: 'act7-encourage-struggling',
        number: '១',
        text: 'លើកទឹកចិត្តសិស្សដែលមានការលំបាក',
        fieldName: 'act7_1_encourage_struggling_students',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-ask-explain',
        number: '២',
        text: 'សុំឲ្យសិស្សពន្យល់',
        fieldName: 'act7_2_ask_students_to_explain',
        rubricType: 'checkbox',
        maxScore: 1
      },
      {
        id: 'act7-connect-real-life',
        number: '៣',
        text: 'ភ្ជាប់ការរៀនទៅនឹងជីវិតពិត',
        fieldName: 'act7_3_connect_learning_to_real_life',
        rubricType: 'checkbox',
        maxScore: 1
      }
    ]
  }
];

// Template for observation forms - KH-G1-Level1, KH-G1-Level2, and KH-G1-Level3
export const OBSERVATION_TEMPLATES = {
  'KH-G1-Level1': KH_G1_LEVEL1_ACTIVITIES, // Primary template for Grade 1 Khmer Level 1
  'KH-G1-Level2': KH_G1_LEVEL2_ACTIVITIES, // Primary template for Grade 1 Khmer Level 2
  'KH-G1-Level3': KH_G1_LEVEL3_ACTIVITIES, // Primary template for Grade 1 Khmer Level 3
};

// Helper function to create a form from template
export function createFormFromTemplate(
  templateCode: string,
  formName: string
) {
  const template = OBSERVATION_TEMPLATES[templateCode as keyof typeof OBSERVATION_TEMPLATES];
  if (!template) return null;

  return {
    name: formName,
    category: 'observation',
    sections: template.map(activity => ({
      id: `section-${activity.id}`,
      title: activity.title,
      order: activity.order,
      fields: activity.indicators.map((indicator, index) => ({
        id: `field-${indicator.id}`,
        type: indicator.rubricType === 'scale' ? 'scale' : 'checkbox',
        name: indicator.fieldName, // Use the database field name
        label: indicator.text,
        required: true,
        order: index, // Use simple index for ordering
        validation: {
          ...(indicator.rubricType === 'scale' && {
            min: 1,
            max: indicator.maxScore || 3,
          }),
        },
        options: indicator.scales?.map(scale => ({
          value: scale.value.toString(),
          label: `${scale.label} - ${scale.description}`,
        })),
        metadata: {
          indicatorNumber: indicator.number,
          maxScore: indicator.maxScore,
          rubricType: indicator.rubricType,
          activityCode: activity.code, // Store activity code for database reference
        },
      })),
    })),
  };
}