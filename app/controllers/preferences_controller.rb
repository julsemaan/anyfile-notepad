class PreferencesController < GOauthController
  def get_update
    @preferences.set_preferences(params)
    session[:preferences] = @preferences.hash
    @preferences.save
    render text: "#{@preferences.hash} #{params}"
  end
  
  def get_persisted_preferences_files
    render text: @gapi.count_preferences
  end
end