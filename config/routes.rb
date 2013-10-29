AnyfileNotepad::Application.routes.draw do
  resources :extensions
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
  
  match 'login' => 'admin#login'
  match 'logout' => 'admin#logout'
  
  resources :site_content
  
  resources :g_files, :controller => :editor do
    member do
      get 'set_syntax/:ace_syntax', :action => 'set_syntax'
    end
  end
  resources :mime_types
  
  match 'preferences/get_update' => 'preferences#get_update'
  
  root :to => 'pages#home'
end
