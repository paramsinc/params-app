const pino = require('pino')

const logger = (defaultConfig) =>
  process.env['NODE_ENV'] === 'production'
    ? // JSON in production
      pino({
        ...defaultConfig,
        level: 'warn',
      })
    : // Pretty print in development
      pino({
        ...defaultConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
        level: 'debug',
      })

module.exports = {
  logger,
}
