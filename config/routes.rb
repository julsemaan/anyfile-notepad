AnyfileNotepad::Application.routes.draw do
  resources :extensions
  resources :syntaxes

  match '/mime_types/submit_unknown' => 'mime_types#submit_unknown'
  resources :mime_types do
    member do
      post 'mark_integrated'
    end
  end

  match 'editor/new/' => 'editor#app'
  match 'editor/new/:folder_id' => 'editor#app'
  match '/editor/edit' => 'editor#app'
  match 'editor/edit/:id' => 'editor#app'
  match '/app' => 'editor#app'
  
  namespace :admin do
  match '/app/print' => 'editor#print'
    get 'login'
    get 'logout'
    get 'menu'
    get 'long_query_test'
  end
   
  resources :mime_types
  
  match 'faq' => 'pages#faq'
  match 'news' => 'pages#news'
  match 'help_translate' => 'pages#help_translate'
  root :to => 'pages#home'
end
