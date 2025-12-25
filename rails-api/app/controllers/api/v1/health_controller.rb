module Api
  module V1
    class HealthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:check]

      # GET /api/v1/health
      def check
        health_status = {
          status: 'healthy',
          timestamp: Time.current.iso8601,
          version: '1.0.0',
          services: {}
        }

        # Check database connection
        begin
          ActiveRecord::Base.connection.execute('SELECT 1')
          health_status[:services][:database] = { status: 'up' }
        rescue StandardError => e
          health_status[:status] = 'unhealthy'
          health_status[:services][:database] = {
            status: 'down',
            error: e.message
          }
        end

        # Check Redis connection
        begin
          Redis.current.ping
          health_status[:services][:redis] = { status: 'up' }
        rescue StandardError => e
          health_status[:status] = 'unhealthy'
          health_status[:services][:redis] = {
            status: 'down',
            error: e.message
          }
        end

        status_code = health_status[:status] == 'healthy' ? :ok : :service_unavailable

        render json: health_status, status: status_code
      end

      def public_action?
        true
      end
    end
  end
end
