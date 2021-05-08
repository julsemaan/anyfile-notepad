#!/usr/bin/perl

use strict;
use warnings;

use Template;
use Getopt::Long;
use JSON;
use File::Slurp qw(read_file);
use Tie::IxHash;

my ($COMPILED_APP_DIR, $APP_VERSION_ID, $APP_VERSION, $APP_COMMIT_ID, $SYNTAX_DB);
GetOptions(
    "COMPILED_APP_DIR=s" => \$COMPILED_APP_DIR,
    "APP_VERSION_ID=s" => \$APP_VERSION_ID, 
    "APP_VERSION=s" => \$APP_VERSION, 
    "APP_COMMIT_ID=s" => \$APP_COMMIT_ID,
    "SYNTAX_DB=s" => \$SYNTAX_DB,
) or die("Error in command line arguments\n");;

my $tt = Template->new({INCLUDE_PATH => [$COMPILED_APP_DIR, '.']}); 

my @THEMES;

opendir(my $ace_dir, "$COMPILED_APP_DIR/ace.js") or die("Can't open themes dir : $!");
while(my $file = readdir $ace_dir) {
    if($file =~ /^theme-(.*)\.js/) {
        my $theme_name = $1;
        my $display_name = $theme_name;
        $display_name =~ s/_/-/g;
        $theme_name = "ace/theme/$theme_name";
        push @THEMES, {theme_name => $theme_name, theme_display_name => $display_name};
    }
}

tie my %SYNTAXES, 'Tie::IxHash';

my $syntaxes_db = decode_json(read_file($SYNTAX_DB));

my @GROUPS = (
    ['A', 'B'],
    ['C'],
    ['D', 'E', 'F', 'G'],
    ['H', 'I'],
    ['J', 'K'],
    ['L'],
    ['M', 'N', 'O'],
    ['P', 'Q', 'R'],
    ['S'],
    ['T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z']
);

foreach my $group (@GROUPS) {
    my @tmp;
    my $letters = '';
    foreach my $letter (@$group) {
        $letters = $letters . $letter . ' ';
        foreach my $syntax (@$syntaxes_db) {
            if(lc(substr($syntax->{display_name}, 0, 1)) eq lc($letter)){
                push @tmp, $syntax;
            }
        }
    }
    $SYNTAXES{$letters} = \@tmp;
}

my $args = {
    APP_VERSION_ID => $APP_VERSION_ID, 
    APP_VERSION => $APP_VERSION, 
    APP_COMMIT_ID => $APP_COMMIT_ID,
    THEMES_JSON => encode_json(\@THEMES),
    SYNTAXES_JSON => encode_json(\%SYNTAXES),
};

$tt->process('editor-layout.tt', {%$args, WITH_ADS => 1}, $COMPILED_APP_DIR.'/app.html') || die $tt->error();
$tt->process('editor-layout.tt', {%$args, WITH_ADS => 0}, $COMPILED_APP_DIR.'/app-plus-plus.html') || die $tt->error();




