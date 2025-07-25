const axios = require('axios');

async function addGrade1KhmerObservationForm() {
  // First, let's test the observation-forms endpoint
  try {
    console.log('Checking current observation forms...');
    const response = await axios.get('http://localhost:3000/api/v1/observation-forms');
    console.log('Current forms count:', response.data.data.length);
    
    // Find if our form exists
    const grade1Form = response.data.data.find(form => 
      form.title && form.title.includes('ឧបករណ៍សង្កេតគ្រូថ្នាក់ទី១')
    );
    
    if (grade1Form) {
      console.log('✅ Grade 1 Khmer form already exists:', grade1Form.title);
    } else {
      console.log('❌ Grade 1 Khmer form not found in observation-forms list');
      console.log('Available forms:', response.data.data.map(f => f.title));
    }
    
    // Now check the forms endpoint
    console.log('\nChecking forms endpoint...');
    const formsResponse = await axios.get('http://localhost:3000/api/v1/forms');
    console.log('Forms count:', formsResponse.data.data.forms.length);
    console.log('Form titles:', formsResponse.data.data.forms.map(f => f.name || f.nameKm));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addGrade1KhmerObservationForm();