worker_processes Integer(ENV["WEB_CONCURRENCY"] || 3)
timeout Integer(ENV["UNICORN_TIMEOUT"] || 30)
 
preload_app true
 
before_exec do |server|
  ENV["RUBY_HEAP_MIN_SLOTS"]=800000
  ENV["RUBY_GC_MALLOC_LIMIT"]=59000000
  ENV["RUBY_HEAP_SLOTS_INCREMENT"]=10000
  ENV["RUBY_HEAP_SLOTS_GROWTH_FACTOR"]=1
  ENV["RUBY_HEAP_FREE_MIN"]=100000
end
 
before_fork do |server, worker|
  Signal.trap "TERM" do
    puts "Unicorn master intercepting TERM and sending myself QUIT instead"
    Process.kill "QUIT", Process.pid
  end
 
  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.connection.disconnect!
end
 
after_fork do |server, worker|
  Signal.trap "TERM" do
    puts "Unicorn worker intercepting TERM and doing nothing. Wait for master to send QUIT"
  end
 
  if defined?(ActiveRecord::Base)
    config = Rails.application.config.database_configuration[Rails.env]
    config["reaping_frequency"] = ENV["DB_REAP_FREQ"] || 10 # seconds
    config["pool"]              = ENV["DB_POOL"] || 6
    ActiveRecord::Base.establish_connection(config)
  end
end