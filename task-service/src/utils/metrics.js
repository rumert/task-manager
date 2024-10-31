const client = require('prom-client');

const healthGauge = new client.Gauge({
  name: 'service_health_status',
  help: 'Health status of the service, 1 for healthy, 0 for unhealthy',
});

function updateHealthStatus(isHealthy) {
  healthGauge.set(isHealthy ? 1 : 0);
}

setInterval(() => {
  const isHealthy = true;
  updateHealthStatus(isHealthy);
}, 5000);

module.exports = client