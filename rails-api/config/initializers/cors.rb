# CORS configuration for API access
# See: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In production, replace with actual frontend URL
    origins ENV.fetch("FRONTEND_URL", "http://localhost:5173")

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      max_age: 86400 # 24 hours
  end
end
