require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
# require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
# require "action_cable/engine"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module RailsApi
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # API-only application
    config.api_only = true

    # Session store configuration
    config.session_store :redis_store,
                         servers: ENV.fetch("REDIS_URL", "redis://localhost:6379/0/session"),
                         expire_after: 24.hours,
                         key: "_ec_site_session",
                         threadsafe: true,
                         signed: true

    # Cache store configuration
    config.cache_store = :redis_cache_store, {
      url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
      namespace: "ec_site_cache",
      expires_in: 15.minutes,
      reconnect_attempts: 3
    }

    # Middleware configuration
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Timezone and locale
    config.time_zone = "UTC"
    config.active_record.default_timezone = :utc

    # Autoload paths
    config.autoload_paths += %W(#{config.root}/app/services)

    # CORS configuration (see initializers/cors.rb)
    config.middleware.insert_before 0, Rack::Cors

    # Logging
    config.log_level = :info
    config.log_tags = [:request_id]

    # Active Job queue adapter
    # config.active_job.queue_adapter = :sidekiq

    # Don't generate system test files
    config.generators.system_tests = nil

    # Generator settings
    config.generators do |g|
      g.test_framework :minitest, fixture: true
      g.fixture_replacement :factory_bot, dir: "test/factories"
      g.skip_routes true
      g.helper false
      g.assets false
    end
  end
end
