# Redis configuration for session store and caching
# Redis connection is configured through cache_store in environment files

# テスト環境は DB 1 を使い、開発環境 (DB 0) と分離する
default_db = Rails.env.test? ? 1 : 0

redis_config = {
  host: ENV.fetch('REDIS_HOST', 'localhost'),
  port: ENV.fetch('REDIS_PORT', 6379).to_i,
  db:   ENV.fetch('REDIS_DB', default_db).to_i
}

$redis = Redis.new(redis_config)

Rails.logger.info "Redis connected to #{redis_config[:host]}:#{redis_config[:port]}/#{redis_config[:db]}"
