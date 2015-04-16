source 'https://rubygems.org'

gem 'rails', '3.2.17'

gem 'browser'

gem 'unicorn'
gem 'unicorn-worker-killer'

#gem 'sqlite3'
gem 'fingerbank_client', :git => 'git://github.com/julsemaan/fingerbank_client', :branch => 'master'

group :production do
  gem 'pg'
  gem 'newrelic_rpm'
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'
  gem 'bootstrap-sass', '= 3.1.1.0'

  gem 'therubyracer', :platforms => :ruby

  gem 'uglifier', '>= 1.0.3'
end

gem 'jquery-rails'
gem 'jquery-ui-rails'

gem 'google-api-client'
