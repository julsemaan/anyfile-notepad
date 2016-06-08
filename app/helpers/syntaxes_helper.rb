module SyntaxesHelper
  GROUPS = [
    [:A, :B],
    [:C],
    [:D, :E, :F, :G],
    [:H, :I],
    [:J, :K],
    [:L],
    [:M, :N, :O],
    [:P, :Q, :R],
    [:S],
    [:T],
    [:U, :V, :X, :Y]
  ]
  
  def build_syntax_menus
    syntaxes = {}
    GROUPS.each do |g|
      tmp = []
      letters = ""
      g.each do |l|
        letters = letters + ' ' + l.to_s
        Syntax.all.each do |s|
          if s.display_name[0].downcase == l.to_s.downcase
            tmp << s
          end
        end
      end
      syntaxes[letters] = tmp
    end
    #puts syntaxes
    syntaxes

  end
end
