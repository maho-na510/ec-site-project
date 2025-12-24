# Redis configuration for session store and caching

REDIS_CONFIG = {
  url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
  driver: :hiredis,
  reconnect_attempts: 3,
  reconnect_delay: 0.5,
  reconnect_delay_max: 5
}

# Initialize Redis connection
Redis.current = Redis.new(REDIS_CONFIG)

# Test Redis connection on startup
begin
  Redis.current.ping
  Rails.logger.info "Redis connection established successfully"
rescue Redis::CannotConnectError => e
  Rails.logger.error "Failed to connect to Redis: #{e.message}"
  Rails.logger.warn "Application will start but Redis-dependent features may not work"
end
