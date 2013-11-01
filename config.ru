# This file is used by Rack-based servers to start the application.

# # Unicorn self-process killer
require "unicorn/worker_killer"
 
# # Max memory size (RSS) per worker
use Unicorn::WorkerKiller::Oom, (170*(1024**2)), (180*(1024**2))

require ::File.expand_path('../config/environment',  __FILE__)
run AnyfileNotepad::Application
