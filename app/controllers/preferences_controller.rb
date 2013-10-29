class PreferencesController < GOauthController
  def get_update
    @preferences = Preferences.new(session[:preferences])
    @preferences.set_preferences(params)
    session[:preferences] = @preferences.hash
    render text: "#{@preferences.hash} #{params}"
  end
end