AnyfileNotepad::Application.routes.draw do
  resources :syntaxes


  resources :mime_types


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
  resources :mime_types
  
  root :to => 'pages#home'
end
