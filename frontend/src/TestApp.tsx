function TestApp() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test App is Working!</h1>
      <p>If you can see this, React is rendering correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  )
}

export default TestApp