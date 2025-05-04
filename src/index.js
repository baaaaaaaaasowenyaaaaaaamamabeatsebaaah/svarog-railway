import './styles.css';

// Simple app that just works
const app = document.getElementById('app');

app.innerHTML = `
  <div class="container">
    <h1>Svarog Railway App</h1>
    <p>Successfully deployed to Railway!</p>
    <p>Current time: ${new Date().toLocaleString()}</p>
  </div>
`;
