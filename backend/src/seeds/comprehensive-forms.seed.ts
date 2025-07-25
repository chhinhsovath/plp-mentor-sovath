import { DataSource } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { CompetencyDomain } from '../entities/competency-domain.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';
import { seedGrade1KhmerForm } from './grade1-khmer-form.seed';

export async function seedComprehensiveForms(dataSource: DataSource) {
  const observationFormRepository = dataSource.getRepository(ObservationForm);
  const lessonPhaseRepository = dataSource.getRepository(LessonPhase);
  const competencyDomainRepository = dataSource.getRepository(CompetencyDomain);
  const indicatorRepository = dataSource.getRepository(Indicator);
  const indicatorScaleRepository = dataSource.getRepository(IndicatorScale);

  console.log('Seeding comprehensive observation forms...');

  // Seed Grade 1 Khmer form with complete indicators
  await seedGrade1KhmerForm(dataSource);

  // Grade 2-6 Khmer Language Forms
  const khmerForms = [
    { grade: '2', code: 'G2-KH', title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - ភាសាខ្មែរ' },
    { grade: '3', code: 'G3-KH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - ភាសាខ្មែរ' },
    { grade: '4', code: 'G4-KH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៤ - ភាសាខ្មែរ' },
    { grade: '5', code: 'G5-KH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៥ - ភាសាខ្មែរ' },
    { grade: '6', code: 'G6-KH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៦ - ភាសាខ្មែរ' },
  ];

  // Mathematics Forms
  const mathForms = [
    { grade: '1', code: 'G1-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី១ - គណិតវិទ្យា' },
    { grade: '2', code: 'G2-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី២ - គណិតវិទ្យា' },
    { grade: '3', code: 'G3-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - គណិតវិទ្យា' },
    { grade: '4', code: 'G4-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៤ - គណិតវិទ្យា' },
    { grade: '5', code: 'G5-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៥ - គណិតវិទ្យា' },
    { grade: '6', code: 'G6-MATH', title: 'ទម្រង់សង្កេតថ្នាក់ទី៦ - គណិតវិទ្យា' },
  ];

  // Science Forms (Grades 3-6)
  const scienceForms = [
    { grade: '3', code: 'G3-SCI', title: 'ទម្រង់សង្កេតថ្នាក់ទី៣ - វិទ្យាសាស្ត្រ' },
    { grade: '4', code: 'G4-SCI', title: 'ទម្រង់សង្កេតថ្នាក់ទី៤ - វិទ្យាសាស្ត្រ' },
    { grade: '5', code: 'G5-SCI', title: 'ទម្រង់សង្កេតថ្នាក់ទី៥ - វិទ្យាសាស្ត្រ' },
    { grade: '6', code: 'G6-SCI', title: 'ទម្រង់សង្កេតថ្នាក់ទី៦ - វិទ្យាសាស្ត្រ' },
  ];

  // Create all forms
  const allForms = [
    ...khmerForms.map(f => ({ ...f, subject: 'Khmer' })),
    ...mathForms.map(f => ({ ...f, subject: 'Mathematics' })),
    ...scienceForms.map(f => ({ ...f, subject: 'Science' })),
  ];

  for (const formData of allForms) {
    // Check if form already exists
    const existingForm = await observationFormRepository.findOne({
      where: { formCode: formData.code }
    });

    if (existingForm) {
      console.log(`Form ${formData.code} already exists, skipping...`);
      continue;
    }

    const form = observationFormRepository.create({
      formCode: formData.code,
      title: formData.title,
      subject: formData.subject,
      gradeRange: formData.grade,
    });

    const savedForm = await observationFormRepository.save(form);
    console.log(`✅ Created form: ${formData.code}`);

    // Create standard lesson phases for each form
    const phases = [
      { title: 'សកម្មភាព១: ការណែនាំមេរៀន', order: 1 },
      { title: 'សកម្មភាព២: សកម្មភាពសិក្សា', order: 2 },
      { title: 'សកម្មភាព៣: សង្ខេបមេរៀន', order: 3 },
    ];

    const savedPhases = [];
    for (const phaseData of phases) {
      const phase = lessonPhaseRepository.create({
        formId: savedForm.id,
        title: phaseData.title,
        sectionOrder: phaseData.order,
      });
      const savedPhase = await lessonPhaseRepository.save(phase);
      savedPhases.push(savedPhase);
    }

    // Create competency domains for subject-specific forms
    if (formData.subject === 'Mathematics') {
      const mathDomains = [
        'លេខនិងប្រមាណវិធី',
        'ធរណីមាត្រ',
        'ការវាស់ស្ទង់',
        'ស្ថិតិនិងប្រូបាប',
      ];

      for (const domainName of mathDomains) {
        const domain = competencyDomainRepository.create({
          formId: savedForm.id,
          subject: formData.subject,
          domainName,
        });
        await competencyDomainRepository.save(domain);
      }
    }

    // Create sample indicators for each phase
    for (let i = 0; i < savedPhases.length; i++) {
      const phase = savedPhases[i];
      const indicators = [
        {
          number: `${i + 1}.១`,
          text: `គ្រូអនុវត្តសកម្មភាពទី${i + 1}យ៉ាងមានប្រសិទ្ធភាព`,
          rubricType: RubricType.SCALE,
          maxScore: 3,
        },
        {
          number: `${i + 1}.២`,
          text: `សិស្សចូលរួមយកចិត្តទុកដាក់ក្នុងសកម្មភាពទី${i + 1}`,
          rubricType: RubricType.SCALE,
          maxScore: 3,
        },
      ];

      // Add checkbox indicator for phase 2 (teaching activities)
      if (i === 1) {
        indicators.push({
          number: `${i + 1}.៣`,
          text: 'គ្រូប្រើប្រាស់សមធ្យានបង្រៀនទំនើប',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1,
        });
      }

      for (const indicatorData of indicators) {
        const indicator = indicatorRepository.create({
          phaseId: phase.id,
          indicatorNumber: indicatorData.number,
          indicatorText: indicatorData.text,
          maxScore: indicatorData.maxScore,
          rubricType: indicatorData.rubricType,
        });

        const savedIndicator = await indicatorRepository.save(indicator);

        // Create scales for scale-type indicators
        if (indicatorData.rubricType === RubricType.SCALE) {
          const scales = [
            { label: '១', description: 'ត្រូវការកែលម្អ' },
            { label: '២', description: 'ល្អបង្គួរ' },
            { label: '៣', description: 'ល្អឥតខ្ចោះ' },
          ];

          for (const scaleData of scales) {
            const scale = indicatorScaleRepository.create({
              indicatorId: savedIndicator.id,
              scaleLabel: scaleData.label,
              scaleDescription: scaleData.description,
            });
            await indicatorScaleRepository.save(scale);
          }
        }
      }
    }

    console.log(`✅ Created phases and indicators for ${formData.code}`);
  }

  console.log('🎉 Comprehensive forms seeding completed!');
}