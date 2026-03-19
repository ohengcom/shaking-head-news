export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Log context can contain arbitrary diagnostic values.
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: Error
}

const config = {
  minLevel:
    (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  structured: process.env.NODE_ENV === 'production',
}

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[config.minLevel]
}

function formatLogEntry(entry: LogEntry): string {
  if (config.structured) {
    return JSON.stringify({
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      context: entry.context,
      error: entry.error
        ? {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          }
        : undefined,
    })
  }

  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message]

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context))
  }

  if (entry.error) {
    parts.push(`\n${entry.error.stack || entry.error.message}`)
  }

  return parts.join(' ')
}

function outputToConsole(entry: LogEntry) {
  const formatted = formatLogEntry(entry)

  switch (entry.level) {
    case 'debug':
      console.debug(formatted)
      break
    case 'info':
      console.info(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'error':
      console.error(formatted)
      break
  }
}

function createLogEntry(
  level: LogLevel,
  message: string,
  error?: Error,
  context?: LogContext
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  }
}

function log(level: LogLevel, message: string, error?: Error, context?: LogContext) {
  if (!shouldLog(level)) {
    return
  }

  outputToConsole(createLogEntry(level, message, error, context))
}

export const logger = {
  debug(message: string, context?: LogContext) {
    log('debug', message, undefined, context)
  },

  info(message: string, context?: LogContext) {
    log('info', message, undefined, context)
  },

  warn(message: string, context?: LogContext) {
    log('warn', message, undefined, context)
  },

  error(message: string, error?: Error, context?: LogContext) {
    log('error', message, error, context)
  },

  apiRequest(method: string, url: string, context?: LogContext) {
    this.debug(`API Request: ${method} ${url}`, context)
  },

  apiResponse(method: string, url: string, status: number, duration: number) {
    this.debug(`API Response: ${method} ${url} - ${status} (${duration}ms)`)
  },

  apiError(method: string, url: string, error: Error, context?: LogContext) {
    this.error(`API Error: ${method} ${url}`, error, context)
  },

  userAction(action: string, context?: LogContext) {
    this.info(`User Action: ${action}`, context)
  },

  auth(event: 'login' | 'logout' | 'register', userId?: string) {
    this.info(`Auth: ${event}`, { userId })
  },

  database(operation: string, table: string, duration?: number) {
    this.debug(`Database: ${operation} ${table}`, { duration })
  },

  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string) {
    this.debug(`Cache: ${operation} ${key}`)
  },

  performance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric} = ${value}${unit}`)
  },

  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        this.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        this.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        this.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error, context?: LogContext) =>
        this.error(message, error, { ...defaultContext, ...context }),
    }
  },
}

export function createLogger(module: string) {
  return logger.child({ module })
}

export async function logExecutionTime<T>(
  name: string,
  fn: () => T | Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start
    logger.performance(name, Math.round(duration), 'ms')
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`${name} failed after ${Math.round(duration)}ms`, error as Error, context)
    throw error
  }
}

export function logError(message: string, error: unknown, context?: LogContext): never {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error(message, err, context)
  throw err
}

export function safeLog(fn: () => void) {
  try {
    fn()
  } catch (error) {
    console.error('[Logger] Failed to log:', error)
  }
}

export default logger
