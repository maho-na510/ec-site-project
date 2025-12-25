# Redis configuration for session store and caching
# Redis connection is configured through cache_store in environment files

# Initialize Redis connection for general use
redis_config = {
  host: ENV.fetch('REDIS_HOST', 'localhost'),
  port: ENV.fetch('REDIS_PORT', 6379),
  db: ENV.fetch('REDIS_DB', 0)
}

$redis = Redis.new(redis_config)

Rails.logger.info "Redis connected to #{redis_config[:host]}:#{redis_config[:port]}/#{redis_config[:db]}"
