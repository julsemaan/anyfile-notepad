AnyfileNotepad::Application.routes.draw do
  # The priority is based upon order of creation:
  # first created -> highest priority.

  match 'jqueryfiletree/content' => 'jqueryfiletree#content'
  
  match 'g_api/user' => 'g_api#user'
  match 'g_api/about' => 'g_api#about'
  match 'g_api/svc' => 'g_api#svc'
  match 'g_api/welcome' => 'g_api#welcome'

  match '/editor/edit' => 'application#execute_default'
  
  match 'editor/new/' => 'editor#new'
  match 'editor/new/:folder_id' => 'editor#new'
  match 'editor/edit/:id' => 'editor#edit'
  
  resources :g_files, :controller => :editor
  
  root :to => 'g_api#welcome'
end
