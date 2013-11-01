class CreateSyntaxes < ActiveRecord::Migration
  def change
    create_table :syntaxes do |t|
      t.string :display_name
      t.string :ace_js_mode
      t.timestamps
    end
    
    Syntax.create!(:display_name => "Plain text", :ace_js_mode => "plain_text")
  end
end
