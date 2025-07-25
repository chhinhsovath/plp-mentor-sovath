import { DataSource } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';

export async function seedObservationForms(dataSource: DataSource) {
  const observationFormRepository = dataSource.getRepository(ObservationForm);
  const lessonPhaseRepository = dataSource.getRepository(LessonPhase);
  const indicatorRepository = dataSource.getRepository(Indicator);
  const indicatorScaleRepository = dataSource.getRepository(IndicatorScale);

  // Check if forms already exist
  const existingForms = await observationFormRepository.count();
  if (existingForms > 0) {
    console.log('Observation forms already exist, skipping seed...');
    return;
  }

  console.log('Seeding observation forms...');

  // Create Grade 1 Khmer form
  const g1KhmerForm = observationFormRepository.create({
    formCode: 'G1-KH',
    title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - ភាសាខ្មែរ',
    subject: 'Khmer',
    gradeRange: '1',
  });

  const savedG1Form = await observationFormRepository.save(g1KhmerForm);
  console.log('✅ Created form: G1-KH');

  // Create lesson phases for G1 Khmer
  const phase1 = lessonPhaseRepository.create({
    formId: savedG1Form.id,
    title: 'សកម្មភាព១: ការណែនាំមេរៀន',
    sectionOrder: 1,
  });

  const phase2 = lessonPhaseRepository.create({
    formId: savedG1Form.id,
    title: 'សកម្មភាព២: សកម្មភាពសិក្សា',
    sectionOrder: 2,
  });

  const phase3 = lessonPhaseRepository.create({
    formId: savedG1Form.id,
    title: 'សកម្មភាព៣: សង្ខេបមេរៀន',
    sectionOrder: 3,
  });

  const savedPhase1 = await lessonPhaseRepository.save(phase1);
  const savedPhase2 = await lessonPhaseRepository.save(phase2);
  const savedPhase3 = await lessonPhaseRepository.save(phase3);

  console.log('✅ Created lesson phases for G1-KH');

  // Create indicators for Phase 1
  const indicator1_1 = indicatorRepository.create({
    phaseId: savedPhase1.id,
    indicatorNumber: '១.១',
    indicatorText: 'គ្រូណែនាំផែនការបង្រៀនដល់សិស្សយ៉ាងច្បាស់',
    maxScore: 3,
    rubricType: RubricType.SCALE,
  });

  const indicator1_2 = indicatorRepository.create({
    phaseId: savedPhase1.id,
    indicatorNumber: '១.២',
    indicatorText: 'គ្រូបង្កើតបរិយាកាសរៀនសូត្រដ៏ល្អ',
    maxScore: 3,
    rubricType: RubricType.SCALE,
  });

  const savedIndicator1_1 = await indicatorRepository.save(indicator1_1);
  const savedIndicator1_2 = await indicatorRepository.save(indicator1_2);

  // Create indicators for Phase 2
  const indicator2_1 = indicatorRepository.create({
    phaseId: savedPhase2.id,
    indicatorNumber: '២.១',
    indicatorText: 'សិស្សចូលរួមយកចិត្តទុកដាក់សកម្មភាពសិក្សា',
    maxScore: 3,
    rubricType: RubricType.SCALE,
  });

  const indicator2_2 = indicatorRepository.create({
    phaseId: savedPhase2.id,
    indicatorNumber: '២.២',
    indicatorText: 'គ្រូប្រើសមធ្យានទំនើបក្នុងការបង្រៀន',
    maxScore: 1,
    rubricType: RubricType.CHECKBOX,
  });

  const indicator2_3 = indicatorRepository.create({
    phaseId: savedPhase2.id,
    indicatorNumber: '២.៣',
    indicatorText: 'គ្រូផ្តល់ឱកាសឱ្យសិស្សបង្ហាញការយល់ដឹង',
    maxScore: 3,
    rubricType: RubricType.SCALE,
  });

  const savedIndicator2_1 = await indicatorRepository.save(indicator2_1);
  const savedIndicator2_2 = await indicatorRepository.save(indicator2_2);
  const savedIndicator2_3 = await indicatorRepository.save(indicator2_3);

  // Create indicators for Phase 3
  const indicator3_1 = indicatorRepository.create({
    phaseId: savedPhase3.id,
    indicatorNumber: '៣.១',
    indicatorText: 'គ្រូសង្ខេបមេរៀនយ៉ាងច្បាស់',
    maxScore: 3,
    rubricType: RubricType.SCALE,
  });

  const savedIndicator3_1 = await indicatorRepository.save(indicator3_1);

  console.log('✅ Created indicators for G1-KH');

  // Create scales for scale-type indicators
  const scaleIndicators = [
    savedIndicator1_1,
    savedIndicator1_2,
    savedIndicator2_1,
    savedIndicator2_3,
    savedIndicator3_1,
  ];

  for (const indicator of scaleIndicators) {
    const scales = [
      {
        indicatorId: indicator.id,
        scaleLabel: '១',
        scaleDescription: 'ត្រូវការកែលម្អ',
      },
      {
        indicatorId: indicator.id,
        scaleLabel: '២',
        scaleDescription: 'ល្អបង្គួរ',
      },
      {
        indicatorId: indicator.id,
        scaleLabel: '៣',
        scaleDescription: 'ល្អឥតខ្ចោះ',
      },
    ];

    for (const scaleData of scales) {
      const scale = indicatorScaleRepository.create(scaleData);
      await indicatorScaleRepository.save(scale);
    }
  }

  console.log('✅ Created indicator scales for G1-KH');

  // Create additional forms for other grades/subjects
  const additionalForms = [
    {
      formCode: 'G2-KH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - ភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '2',
    },
    {
      formCode: 'G1-MATH',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - គណិតវិទ្យា',
      subject: 'Mathematics',
      gradeRange: '1',
    },
    {
      formCode: 'G3-SCI',
      title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - វិទ្យាសាស្ត្រ',
      subject: 'Science',
      gradeRange: '3',
    },
  ];

  for (const formData of additionalForms) {
    const form = observationFormRepository.create(formData);
    await observationFormRepository.save(form);
    console.log(`✅ Created form: ${formData.formCode}`);
  }

  console.log('🎉 Observation forms seeding completed!');
}
