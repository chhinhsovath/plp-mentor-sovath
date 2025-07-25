import { FormTemplate, FormSection, FormField } from '../types/form';

export interface CSVRow {
  id: string;
  order: string;
  subject: string;
  grade: string;
  level: string;
  field_type_one: string;
  field_type_two: string;
  field_type_three: string;
  field_type_four?: string;
  label_type: string;
  text_label: string;
  indicator: string;
  response: string;
}

// Parse CSV data into structured forms
export function generateFormsFromCSV(csvData: CSVRow[]): FormTemplate[] {
  const formMap = new Map<string, FormTemplate>();
  
  // Group by subject and grade
  csvData.forEach(row => {
    const formKey = `${row.subject}_${row.grade}`;
    
    if (!formMap.has(formKey)) {
      const formId = `form_${row.subject.toLowerCase()}_${row.grade.toLowerCase().replace(/,/g, '-')}`;
      const formName = row.subject === 'KH' 
        ? `ភាសាខ្មែរ ថ្នាក់ទី${row.grade.replace('G', '')}` 
        : `គណិតវិទ្យា ថ្នាក់ទី${row.grade.replace(/[G\\,]/g, '')}`;
      
      formMap.set(formKey, {
        id: formId,
        name: formName,
        description: `ទម្រង់វាយតម្លៃសម្រាប់ ${formName}`,
        category: 'observation',
        sections: [],
        settings: {
          allowSaveDraft: true,
          requireApproval: false,
          enableVersioning: true,
        },
        metadata: {
          version: 1,
          createdBy: 'system',
          createdAt: new Date(),
        },
        status: 'published',
        targetGrades: row.grade.split(',').map(g => g.trim()),
        targetSubjects: [row.subject],
      });
    }
    
    const form = formMap.get(formKey)!;
    
    // Find or create section based on level
    let section = form.sections.find(s => s.id === `section_${row.level}`);
    if (!section) {
      const levelMap: Record<string, string> = {
        'LEVEL-1': 'កម្រិតទី១',
        'LEVEL-2': 'កម្រិតទី២', 
        'LEVEL-3': 'កម្រិតទី៣'
      };
      
      section = {
        id: `section_${row.level}`,
        title: levelMap[row.level] || row.level,
        fields: [],
        order: parseInt(row.level.replace('LEVEL-', ''))
      };
      form.sections.push(section);
    }
    
    // Create field
    const field: FormField = {
      id: `field_${row.id}`,
      type: row.field_type_one as any || 'radio',
      name: `question_${row.id}`,
      label: row.indicator,
      description: row.text_label,
      options: row.field_type_one === 'radio' ? [
        { label: 'បាទ/ចាស', value: 'yes' },
        { label: 'ទេ', value: 'no' }
      ] : undefined,
      validation: {
        required: true
      },
      order: parseInt(row.order)
    };
    
    section.fields.push(field);
  });
  
  // Sort sections and fields
  formMap.forEach(form => {
    form.sections.sort((a, b) => a.order - b.order);
    form.sections.forEach(section => {
      section.fields.sort((a, b) => a.order - b.order);
    });
  });
  
  return Array.from(formMap.values());
}

// Grade 1 Khmer form data - moved to allFormsData.ts
/*export const grade1KhmerData: CSVRow[] = [
  // LEVEL-1
  {id: "1", order: "1", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "ការរំឭកមេរៀន", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "2", order: "2", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ១៖ ការស្គាល់សូរអក្សរថ្មី", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "3", order: "3", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ១៖ ការស្គាល់សូរអក្សរថ្មី", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "4", order: "4", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ១៖ ការស្គាល់សូរអក្សរថ្មី", indicator: "៣. អនុវត្តតាមពេលវេលាកំណត់ ដែរឬទេ?", response: ""},
  {id: "5", order: "5", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ២៖ ការស្គាល់តួអក្សរថ្មី", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "6", order: "6", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ២៖ ការស្គាល់តួអក្សរថ្មី", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "7", order: "7", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ២៖ ការស្គាល់តួអក្សរថ្មី", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  {id: "8", order: "8", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "9", order: "9", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "10", order: "10", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "៤. ឱ្យសិស្សអានដោយប្រើចង្អុលដៃអូសពីក្រោម និង សម្លឹងមើលតួអក្សរដែរឬទេ?", response: ""},
  {id: "11", order: "11", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  {id: "12", order: "12", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "13", order: "13", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "14", order: "14", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "៤. ឱ្យសិស្សអានដោយប្រើចង្អុលដៃអូសពីក្រោម និង សម្លឹងមើលតួអក្សរដែរឬទេ?", response: ""},
  {id: "15", order: "15", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  {id: "16", order: "16", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៤៖ វាក្យសព្ទ", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "17", order: "17", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៤៖ វាក្យសព្ទ", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "18", order: "18", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "19", order: "19", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "20", order: "20", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "៤. ឱ្យសិស្សអានដោយប្រើចង្អុលដៃអូសពីក្រោម និង សម្លឹងមើលតួអក្សរដែរឬទេ?", response: ""},
  {id: "21", order: "21", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  {id: "22", order: "22", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "23", order: "23", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "24", order: "24", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "៤. ឱ្យសិស្សអានដោយប្រើចង្អុលដៃអូសពីក្រោម និង សម្លឹងមើលតួអក្សរដែរឬទេ?", response: ""},
  {id: "25", order: "25", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  {id: "26", order: "26", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៧៖ ការសរសេរ", indicator: "១. ប្រើប្រាស់សៀវភៅណែនាំគ្រូ(អនុវតជំហានសកម្មភាពតាមលំដាប់លំដោយ) ដែរឬទេ?", response: ""},
  {id: "27", order: "27", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៧៖ ការសរសេរ", indicator: "២. ធ្វើតាមលំនាំគ្រូធ្វើគ្រូនិង​សិស្សធ្វើ សិស្សធ្វើ ដែរឬទេ?", response: ""},
  {id: "28", order: "28", subject: "KH", grade: "G1", level: "LEVEL-1", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៧៖ ការសរសេរ", indicator: "៥. ដើរតាមតុ ពិនិត្យ ការសរសេរ ឬការអានរបស់សិស្ស ដែរឬទេ?", response: ""},
  // LEVEL-2
  {id: "29", order: "1", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "ការរំឭកមេរៀន (គ្រូអាចមិនប្រើអក្សរដិតក្នុងសៀវភៅបាន)", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "30", order: "2", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ១៖ ការស្គាល់សូរអក្សរថ្មី", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "31", order: "3", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ២៖ ការស្គាល់តួអក្សរថ្មី", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "32", order: "4", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "33", order: "5", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "៧. ឱ្យសិស្សអានច្រើនដង (ទាំងការអានជាមួយដៃគូ ឬអានដោយខ្លួនឯង) ដែរឬទេ?", response: ""},
  {id: "34", order: "6", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "35", order: "7", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "៧. ឱ្យសិស្សអានច្រើនដង (ទាំងការអានជាមួយដៃគូ ឬអានដោយខ្លួនឯង) ដែរឬទេ?", response: ""},
  {id: "36", order: "8", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៤៖ វាក្យសព្ទ", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "37", order: "9", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "38", order: "10", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "៧. ឱ្យសិស្សអានច្រើនដង (ទាំងការអានជាមួយដៃគូ ឬអានដោយខ្លួនឯង) ដែរឬទេ?", response: ""},
  {id: "39", order: "11", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  {id: "40", order: "12", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "៧. ឱ្យសិស្សអានច្រើនដង (ទាំងការអានជាមួយដៃគូ ឬអានដោយខ្លួនឯង) ដែរឬទេ?", response: ""},
  {id: "41", order: "13", subject: "KH", grade: "G1", level: "LEVEL-2", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៧៖ ការសរសេរ", indicator: "៦. ប្រើពាក្យ ដែលសរសេរជាអក្សរដិត ក្នុងសៀវភៅណែនាំគ្រូ ដែរឬទេ?", response: ""},
  // LEVEL-3
  {id: "42", order: "1", subject: "KH", grade: "G1", level: "LEVEL-3", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣a៖ ការអានព្យាង្គ", indicator: "១០. ដើរតាមតុ រួចឈប់ ដើម្បីស្ដាប់សិស្សអាន ហើយជួយសិស្ស ដែលពិបាកអាន ដែរឬទេ?​", response: ""},
  {id: "43", order: "2", subject: "KH", grade: "G1", level: "LEVEL-3", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៣b៖ ការអានពាក្យ", indicator: "១០. ដើរតាមតុ រួចឈប់ ដើម្បីស្ដាប់សិស្សអាន ហើយជួយសិស្ស ដែលពិបាកអាន ដែរឬទេ?​", response: ""},
  {id: "44", order: "3", subject: "KH", grade: "G1", level: "LEVEL-3", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៥៖ ការអានល្បះ (មិនមានក្នុងមេរៀនស្ពានទេ)", indicator: "១០. ដើរតាមតុ រួចឈប់ ដើម្បីស្ដាប់សិស្សអាន ហើយជួយសិស្ស ដែលពិបាកអាន ដែរឬទេ?​", response: ""},
  {id: "45", order: "4", subject: "KH", grade: "G1", level: "LEVEL-3", field_type_one: "radio", field_type_two: "", field_type_three: "", label_type: "text", text_label: "សកម្មភាព ៦៖ ការអានអត្ថបទខ្លី", indicator: "១០. ដើរតាមតុ រួចឈប់ ដើម្បីស្ដាប់សិស្សអាន ហើយជួយសិស្ស ដែលពិបាកអាន ដែរឬទេ?​", response: ""}
];*/