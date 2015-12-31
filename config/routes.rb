AnyfileNotepad::Application.routes.draw do
  resources :extensions
  resources :syntaxes

  match '/mime_types/submit_unknown' => 'mime_types#submit_unknown'
  resources :mime_types do
    member do
      post 'mark_integrated'
    end
  end


  match 'jqueryfiletree/content' => 'jqueryfiletree#content'
  
  match 'g_api/user' => 'g_api#user'
  match 'g_api/about' => 'g_api#about'
  match 'g_api/svc' => 'g_api#svc'
  match 'g_api/welcome' => 'g_api#welcome'
  match 'g_oauth/keep_alive' => 'g_oauth#keep_alive'
  
  match 'editor/new/' => 'editor#app'
  match 'editor/new/:folder_id' => 'editor#app'
  match '/editor/edit' => 'editor#app'
  match 'editor/edit/:id' => 'editor#app'
  match '/app' => 'editor#app'
  match '/app/print' => 'editor#print'
  
  namespace :admin do
    get 'login'
    get 'logout'
    get 'menu'
    get 'long_query_test'
  end
   
  resources :site_content
  
  resources :g_files, :controller => :editor
  resources :mime_types
  
  match 'preferences/get_update' => 'preferences#get_update'
  
  match 'faq' => 'pages#faq'
  match 'news' => 'pages#news'
  match 'help_translate' => 'pages#help_translate'
  root :to => 'pages#home'
end
