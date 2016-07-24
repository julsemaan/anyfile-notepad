#!/usr/bin/perl

use strict;
use warnings;

use Template;
use Getopt::Long;
use JSON;

my ($COMPILED_APP_DIR, $APP_VERSION_ID, $APP_VERSION, $APP_COMMIT_ID);
GetOptions(
    "COMPILED_APP_DIR=s" => \$COMPILED_APP_DIR,
    "APP_VERSION_ID=s" => \$APP_VERSION_ID, 
    "APP_VERSION=s" => \$APP_VERSION, 
    "APP_COMMIT_ID=s" => \$APP_COMMIT_ID,
) or die("Error in command line arguments\n");;

my $tt = Template->new({INCLUDE_PATH => [$COMPILED_APP_DIR, 'client/']}); 

my @THEMES;

opendir(my $ace_dir, "client/public/ace.js") or die("Can't open themes dir : $!");
while(readdir $ace_dir) {
    my $file = $_;
    if($file =~ /^theme-(.*)\.js/) {
        my $theme_name = $1;
        my $display_name = $theme_name;
        $display_name =~ s/_/-/g;
        $theme_name = "ace/theme/$theme_name";
        push @THEMES, {theme_name => $theme_name, theme_display_name => $display_name};
    }
}

$tt->process('editor-layout.tt', {
    APP_VERSION_ID => $APP_VERSION_ID, 
    APP_VERSION => $APP_VERSION, 
    APP_COMMIT_ID => $APP_COMMIT_ID,
    THEMES_JSON => encode_json(\@THEMES),
}, $COMPILED_APP_DIR.'/app.html') || die $tt->error();




