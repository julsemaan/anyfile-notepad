class Jqueryfiletree
  
  FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
  
  def initialize(root, access_token)
    @root = root
    @elements = nil
    @access_token = access_token
  end
  
  def get_all_folder_elements
    if @elements.nil?
      @elements = raw_get_folder_files @root
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

  def raw_get_folder_files(folder_id)
    require 'net/http'
    require 'uri'
    uri = URI.parse("https://www.googleapis.com/drive/v2/files?q='#{folder_id}'+in+parents+and+trashed+%3D+false&fields=items(id%2CmimeType%2Ctitle)")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    request = Net::HTTP::Get.new(uri.request_uri)
    request.add_field 'Authorization', "Bearer #{@access_token}"
    response = http.request(request)
    puts response.body

    children = ActiveSupport::JSON.decode(response.body)

    folders = []
    files = []

    children['items'].each do |child|
      if child['mimeType'] == FOLDER_MIME_TYPE
        folders << GFolder.new(:id => child['id'], :title => child['title'], :persisted => true)
      else
        files << GFile.new(:id => child['id'], :title => child['title'])
      end
    end
    {:folders => folders, :files => files}

  end

end
