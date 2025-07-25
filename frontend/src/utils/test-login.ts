// Test login utility - to be run in browser console
export async function testLogin() {
  try {
    console.log('Logging in with test credentials...');
    
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'chhinhs',
        password: 'password'
      }),
    });

    const data = await response.json();
    
    if (data.access_token) {
      console.log('Login successful!');
      
      // Store the token
      localStorage.setItem('auth_tokens', JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || '',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      }));
      
      // Store the user
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      console.log('Auth data stored. Refreshing page...');
      window.location.reload();
    } else {
      console.error('Login failed:', data);
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
}

// Make it available globally
(window as any).testLogin = testLogin;