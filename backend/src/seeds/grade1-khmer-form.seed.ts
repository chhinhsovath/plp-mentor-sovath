import { DataSource } from 'typeorm';
import { ObservationForm } from '../entities/observation-form.entity';
import { LessonPhase } from '../entities/lesson-phase.entity';
import { Indicator, RubricType } from '../entities/indicator.entity';
import { IndicatorScale } from '../entities/indicator-scale.entity';

export async function seedGrade1KhmerForm(dataSource: DataSource) {
  const observationFormRepository = dataSource.getRepository(ObservationForm);
  const lessonPhaseRepository = dataSource.getRepository(LessonPhase);
  const indicatorRepository = dataSource.getRepository(Indicator);
  const indicatorScaleRepository = dataSource.getRepository(IndicatorScale);

  console.log('🌱 Seeding Grade 1 Khmer observation form...');

  // Check if form already exists
  let form = await observationFormRepository.findOne({
    where: { formCode: 'G1-KH' }
  });

  if (!form) {
    // Create the form
    form = observationFormRepository.create({
      formCode: 'G1-KH',
      title: 'ឧបករណ៍សង្កេតគ្រូថ្នាក់ទី១ មុខវិជ្ជាភាសាខ្មែរ',
      subject: 'Khmer',
      gradeRange: '1',
    });
    form = await observationFormRepository.save(form);
    console.log('✅ Created Grade 1 Khmer form');
  } else {
    console.log('Form G1-KH already exists, updating indicators...');
  }

  // Define the three lesson phases
  const phaseDefinitions = [
    {
      title: 'សកម្មភាព១: ការណែនាំមេរៀន',
      order: 1,
      indicators: [
        {
          number: '1',
          text: 'គ្រូរៀបចំសម្ភារឧបទេសបានគ្រប់គ្រាន់និងមានការរៀបចំបន្ទប់',
          rubricType: RubricType.SCALE,
          maxScore: 3,
          scales: [
            { label: '១', description: 'បានរៀបចំសម្ភារនិងកន្លែងអង្គុយរបស់សិស្សមិនល្អ' },
            { label: '២', description: 'បានរៀបចំសម្ភារនិងកន្លែងអង្គុយរបស់សិស្សបានល្អ' },
            { label: '៣', description: 'បានរៀបចំសម្ភារគ្រប់គ្រាន់និងកន្លែងអង្គុយរបស់សិស្សបានល្អប្រសើរ' }
          ]
        },
        {
          number: '2',
          text: 'ពិនិត្យវត្តមានសិស្ស',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '3',
          text: 'ការណែនាំមុខសញ្ញា',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '4',
          text: 'ការរំឭកមេរៀនចាស់',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '5',
          text: 'ការណែនាំចំណងជើងមេរៀន',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '6',
          text: 'ការណែនាំវត្ថុបំណង',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '7',
          text: 'លើកទឹកចិត្តសិស្ស',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        }
      ]
    },
    {
      title: 'សកម្មភាព២: សកម្មភាពសិក្សា',
      order: 2,
      indicators: [
        {
          number: '1',
          text: 'ការពន្យល់ខ្លឹមសារដោយប្រើសម្ភារបង្រៀន (ទូរសព្ទ/កុំព្យូទ័រ/បន្ទះអេឡិចត្រូនិច)',
          rubricType: RubricType.SCALE,
          maxScore: 3,
          scales: [
            { label: '១', description: 'គ្រូបង្រៀនដោយមិនប្រើសម្ភារឧបទេស (ទំនាក់ទំនងជាមួយគ្រូប៉ុណ្ណោះ)' },
            { label: '២', description: 'គ្រូបង្រៀនដោយប្រើសម្ភារឧបទេសមិនច្បាស់ជាមួយសិស្ស' },
            { label: '៣', description: 'គ្រូពន្យល់ដោយប្រើសម្ភារឧបទេសច្បាស់លាស់សិស្សងាយយល់និងចូលរួម' }
          ]
        },
        {
          number: '2',
          text: 'ការពន្យល់សកម្មភាព',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '3',
          text: 'ការអនុវត្តរួម',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '4',
          text: 'ការអនុវត្តក្រុម',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '5',
          text: 'ការអនុវត្តបុគ្គល',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '6',
          text: 'អានបទអាន (មិនមានក្នុងព្រីនធីប)',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '7',
          text: 'ការងារផ្ទះ',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        }
      ]
    },
    {
      title: 'សកម្មភាព៣: សង្ខេបមេរៀន',
      order: 3,
      indicators: [
        {
          number: '1',
          text: 'គ្រូនិងសិស្សរួមគ្នាសង្ខេបមេរៀនដែលបានរៀនថ្ងៃនេះ',
          rubricType: RubricType.SCALE,
          maxScore: 3,
          scales: [
            { label: '១', description: 'គ្រូសង្ខេបមេរៀនដោយខ្លួនឯង' },
            { label: '២', description: 'គ្រូនិងសិស្សមួយចំនួនតូចសង្ខេបមេរៀន' },
            { label: '៣', description: 'គ្រូនិងសិស្សទាំងអស់រួមគ្នាសង្ខេបមេរៀន' }
          ]
        }
      ]
    }
  ];

  // Additional domain indicators
  const domainIndicators = [
    {
      title: 'ការវាយតម្លៃ',
      indicators: [
        {
          number: '1',
          text: 'សកម្មភាព១: ការណែនាំមេរៀន',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '2',
          text: 'សកម្មភាព២: សកម្មភាពសិក្សា',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '3',
          text: 'សកម្មភាព៣: សង្ខេបមេរៀន',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '4',
          text: 'គ្រូវាយតម្លៃលទ្ធផលរៀន',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '5',
          text: 'ការវាយតម្លៃរួម',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '6',
          text: 'ការវាយតម្លៃក្រុម',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        },
        {
          number: '7',
          text: 'ការវាយតម្លៃបុគ្គល',
          rubricType: RubricType.CHECKBOX,
          maxScore: 1
        }
      ]
    }
  ];

  // Create or update phases and indicators
  for (const phaseData of phaseDefinitions) {
    let phase = await lessonPhaseRepository.findOne({
      where: {
        formId: form.id,
        sectionOrder: phaseData.order
      }
    });

    if (!phase) {
      phase = lessonPhaseRepository.create({
        formId: form.id,
        title: phaseData.title,
        sectionOrder: phaseData.order,
      });
      phase = await lessonPhaseRepository.save(phase);
      console.log(`✅ Created phase: ${phaseData.title}`);
    }

    // Create indicators for this phase
    for (const indicatorData of phaseData.indicators) {
      let indicator = await indicatorRepository.findOne({
        where: {
          phaseId: phase.id,
          indicatorNumber: `${phaseData.order}.${indicatorData.number}`
        }
      });

      if (!indicator) {
        indicator = indicatorRepository.create({
          phaseId: phase.id,
          indicatorNumber: `${phaseData.order}.${indicatorData.number}`,
          indicatorText: indicatorData.text,
          maxScore: indicatorData.maxScore,
          rubricType: indicatorData.rubricType,
        });
        indicator = await indicatorRepository.save(indicator);

        // Create scales if applicable
        if (indicatorData.rubricType === RubricType.SCALE && indicatorData.scales) {
          for (const scaleData of indicatorData.scales) {
            const scale = indicatorScaleRepository.create({
              indicatorId: indicator.id,
              scaleLabel: scaleData.label,
              scaleDescription: scaleData.description,
            });
            await indicatorScaleRepository.save(scale);
          }
        }
      }
    }
  }

  // Create assessment phase
  let assessmentPhase = await lessonPhaseRepository.findOne({
    where: {
      formId: form.id,
      title: 'ការវាយតម្លៃ'
    }
  });

  if (!assessmentPhase) {
    assessmentPhase = lessonPhaseRepository.create({
      formId: form.id,
      title: 'ការវាយតម្លៃ',
      sectionOrder: 4,
    });
    assessmentPhase = await lessonPhaseRepository.save(assessmentPhase);
    console.log('✅ Created assessment phase');
  }

  // Create assessment indicators
  for (const indicatorData of domainIndicators[0].indicators) {
    let indicator = await indicatorRepository.findOne({
      where: {
        phaseId: assessmentPhase.id,
        indicatorNumber: `4.${indicatorData.number}`
      }
    });

    if (!indicator) {
      indicator = indicatorRepository.create({
        phaseId: assessmentPhase.id,
        indicatorNumber: `4.${indicatorData.number}`,
        indicatorText: indicatorData.text,
        maxScore: indicatorData.maxScore,
        rubricType: indicatorData.rubricType,
      });
      await indicatorRepository.save(indicator);
    }
  }

  console.log('🎉 Grade 1 Khmer form seeding completed!');
}