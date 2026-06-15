const healthDot = document.getElementById('health-dot');
const healthLabel = document.getElementById('health-label');
const serviceName = document.getElementById('service-name');

async function loadHealth() {
  try {
    const response = await fetch('/health', { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Health request failed: ${response.status}`);
    }

    const data = await response.json();
    healthDot.classList.add('online');
    healthLabel.textContent = 'Backend online';
    serviceName.textContent = data.service || 'github-discord-notifier';
  } catch (_error) {
    healthDot.classList.add('offline');
    healthLabel.textContent = 'Falha ao consultar /health';
    serviceName.textContent = 'indisponivel';
  }
}

loadHealth();
