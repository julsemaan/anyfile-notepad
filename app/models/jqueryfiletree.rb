class Jqueryfiletree
  
  def initialize(root, gapi)
    @root = root
    @elements = nil
    @gapi = gapi
  end
  
  def get_all_folder_elements
    if @elements.nil?
      @elements = @gapi.get_folder_files @root
      @elements
    else
      @elements
    end
  end

  def get_dirs(path=".")
    #path = "" if path.nil?
    #@path = File.join(File.expand_path(@root), path)
    #@dirs = []
    #if File.exists?(@path)
    #  Dir.entries(@path).each do |dir|
    #    if File.directory?(File.join(@path, dir)) && dir[0,1]!="."
    #      @dirs << dir
    #    end
    #  end
    #end
    dirs = []
    get_all_folder_elements[:folders].each do |e|
      dirs << e
    end
    dirs
  end

  def get_files(path=".")
    #path = "" if path.nil?
    #@path = File.join(File.expand_path(@root), path)
    #@files = []
    #if File.exists?(@path)
    #  Dir.entries(@path).each do |file|
    #    if File.file?(File.join(@path, file))
    #      @files << file
    #    end
    #  end
    #end
    #@files
    
    files = []
    get_all_folder_elements[:files].each do |e|
      files << e
    end
    files
  end

  def get_content(path=".")
      [get_dirs(path), get_files(path)]
  end
end
