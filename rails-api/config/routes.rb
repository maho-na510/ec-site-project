Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # API v1 routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      post 'auth/login', to: 'auth#login'
      post 'auth/register', to: 'auth#register'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/refresh', to: 'auth#refresh'

      # Password reset routes
      post 'passwords/forgot', to: 'passwords#forgot'
      post 'passwords/reset', to: 'passwords#reset'

      # User routes
      get 'users/me', to: 'users#show'
      put 'users/me', to: 'users#update'
      get 'users/me/orders', to: 'users#orders'

      # Product routes
      resources :products, only: [:index, :show] do
        collection do
          get 'search'
          get 'categories/:category_id', to: 'products#by_category'
        end
      end

      # Category routes
      resources :categories, only: [:index, :show]

      # Cart routes
      resource :cart, only: [:show] do
        post 'items', to: 'carts#add_item'
        put 'items/:id', to: 'carts#update_item'
        delete 'items/:id', to: 'carts#remove_item'
        delete 'clear', to: 'carts#clear'
      end

      # Order routes
      resources :orders, only: [:index, :show, :create] do
        member do
          post 'cancel'
        end
      end

      # Health check
      get 'health', to: 'health#check'
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
