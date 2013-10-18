class CreateSyntaxes < ActiveRecord::Migration
  def change
    create_table :syntaxes do |t|
      t.string :display_name
      t.string :ace_js_mode
      t.timestamps
    end
  end
end
