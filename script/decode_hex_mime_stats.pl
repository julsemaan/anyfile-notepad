#!/usr/bin/perl
#
# decode_hex_mime_stats.pl - Extract hex-encoded MIME types from app stats logs
#
# Usage:
#   docker compose logs api | perl script/decode_hex_mime_stats.pl
#   perl script/decode_hex_mime_stats.pl app.log
#   echo '<log line>' | perl script/decode_hex_mime_stats.pl
#
# Scans each input line for the stat key prefix:
#   afn.app.file-edit.mime-type.hex.<hex-encoded-mime>
# and prints the decoded MIME type on stdout.
#
# Non-matching lines are silently ignored.
# Odd-length hex values produce a warning on stderr and continue.

use strict;
use warnings;

my $matched = 0;

while (my $line = <>) {
    while ($line =~ /afn\.app\.file-edit\.mime-type\.hex\.([0-9A-Fa-f]+)/g) {
        my $hex = $1;
        if (length($hex) % 2 != 0) {
            warn "decode_hex_mime_stats.pl: warning: odd-length hex '$hex' at line $.\n";
            next;
        }
        my $decoded = pack("H*", $hex);
        print "$decoded\n";
        $matched = 1;
    }
}

exit $matched ? 0 : 1;
