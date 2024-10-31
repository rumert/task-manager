const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: { 
    node: 'http://elasticsearch:9200',
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: false
  },
  indexPrefix: 'task-manager-logs'
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { 
    service: 'task-executor-service',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new ElasticsearchTransport(esTransportOpts)
  ]
});

logger.on('error', (error) => {
  console.error('Logger transport error:', error);
});

module.exports = logger;