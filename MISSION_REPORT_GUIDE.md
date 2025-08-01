# របៀបចូលប្រើប្រាស់របាយការណ៍បេសកកម្ម / How to Access Mission Reports

## ជំហានទី 1: ចូលទៅកាន់ទំព័របេសកកម្ម / Step 1: Navigate to Missions Page

1. ចូលគណនីរបស់អ្នក (Login to your account)
2. ចុចលើម៉ឺនុយ **"បេសកកម្ម"** (Click on **"Missions"** menu)
3. URL: `http://localhost:5173/missions`

## ជំហានទី 2: ជ្រើសរើសបេសកកម្ម / Step 2: Select a Mission

1. នៅទំព័របេសកកម្ម អ្នកនឹងឃើញបញ្ជីបេសកកម្មទាំងអស់
2. ចុចលើបេសកកម្មណាមួយដើម្បីមើលព័ត៌មានលម្អិត
3. URL: `http://localhost:5173/missions/{mission-id}`

## ជំហានទី 3: ចូលទៅកាន់ផ្ទាំងរបាយការណ៍ / Step 3: Access Reports Tab

នៅទំព័រលម្អិតបេសកកម្ម អ្នកនឹងឃើញផ្ទាំងចំនួន 4:
1. **Details** - ព័ត៌មានលម្អិត
2. **Participants** - អ្នកចូលរួម
3. **របាយការណ៍ (0)** - Reports (number shows count)
4. **Tracking** - ការតាមដាន

ចុចលើផ្ទាំង **"របាយការណ៍"** / Click on **"Reports"** tab

## ជំហានទី 4: បង្កើតរបាយការណ៍ថ្មី / Step 4: Create New Report

### លក្ខខណ្ឌ / Requirements:
- បេសកកម្មត្រូវមានស្ថានភាព **"បានបញ្ចប់" (COMPLETED)**
- Only completed missions can have reports

### ដំណើរការ / Process:
1. ចុចប៊ូតុង **"បង្កើតរបាយការណ៍ថ្មី"**
2. បំពេញទម្រង់របាយការណ៍ដែលមាន:
   - សេចក្តីសង្ខេប (Summary)
   - សមិទ្ធផល (Achievements)
   - បញ្ហាប្រឈម (Challenges)
   - អនុសាសន៍ (Recommendations)
   - ព័ត៌មានជាក់លាក់តាមប្រភេទបេសកកម្ម

## ប្រភេទបេសកកម្ម និងទម្រង់របាយការណ៍ / Mission Types and Report Forms

### 1. ទស្សនកិច្ច (Field Trip)
- ទីតាំងដែលបានទៅទស្សនា
- ចំនួនមនុស្សដែលបានជួប
- របកគំហើញសំខាន់ៗ

### 2. វគ្គបណ្តុះបណ្តាល (Training)
- ចំនួនអ្នកចូលរួម
- ប្រធានបទដែលបានបង្រៀន
- ជំនាញដែលទទួលបាន
- មតិយោបល់របស់អ្នកចូលរួម

### 3. កិច្ចប្រជុំ (Meeting)
- ចំនួនអ្នកចូលរួម
- របៀបវារៈកិច្ចប្រជុំ
- សេចក្តីសម្រេចចិត្ត
- សកម្មភាពត្រូវអនុវត្ត

### 4. ការត្រួតពិនិត្យ (Monitoring)
- ទីតាំងដែលបានត្រួតពិនិត្យ
- ស្ថានភាពអនុលោមភាព
- បញ្ហាដែលរកឃើញ
- វិធានការកែតម្រូវ

## ការវាយតម្លៃផលប៉ះពាល់ / Impact Assessment
គ្រប់របាយការណ៍ទាំងអស់រួមមាន:
- ចំនួនមនុស្សដែលទទួលផលប្រយោជន៍
- វិស័យដែលមានការកែលម្អ
- លទ្ធផលដែលអាចវាស់វែងបាន

## ស្ថានភាពរបាយការណ៍ / Report Status
- **សេចក្តីព្រាង** - Draft
- **បានដាក់ស្នើ** - Submitted
- **បានអនុម័ត** - Approved
- **បានបដិសេធ** - Rejected

## បញ្ហាទូទៅ / Common Issues

### បេសកកម្មមិនទាន់បញ្ចប់ / Mission Not Completed
- អ្នកមិនអាចបង្កើតរបាយការណ៍សម្រាប់បេសកកម្មដែលមិនទាន់បញ្ចប់
- ត្រូវរង់ចាំបេសកកម្មបញ្ចប់សិន

### គ្មានប៊ូតុងបង្កើតរបាយការណ៍ / No Create Report Button
- ពិនិត្យមើលស្ថានភាពបេសកកម្ម
- ត្រូវប្រាកដថាបេសកកម្មមានស្ថានភាព "COMPLETED"

## URL Examples
- បញ្ជីបេសកកម្ម: `http://localhost:5173/missions`
- បង្កើតបេសកកម្ម: `http://localhost:5173/missions/create`
- លម្អិតបេសកកម្ម: `http://localhost:5173/missions/123`
- កែសម្រួលបេសកកម្ម: `http://localhost:5173/missions/123/edit`