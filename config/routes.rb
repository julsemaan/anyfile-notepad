AnyfileNotepad::Application.routes.draw do
  # The priority is based upon order of creation:
  # first created -> highest priority.

  match 'g_api/user' => 'g_api#user'
  match 'g_api/about' => 'g_api#about'
  match 'g_api/svc' => 'g_api#svc'

  match 'editor/new' => 'editor#new'
  match 'editor/edit' => 'editor#edit'
  
  root :to => 'g_api#user'
end
