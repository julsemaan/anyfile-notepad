package main

import "testing"

func TestSetupBlockedUsersMap(t *testing.T) {
	originalBlockedUsers := blockedUsers
	originalMap := blockedUsersMap
	t.Cleanup(func() {
		blockedUsers = originalBlockedUsers
		blockedUsersMap = originalMap
	})

	blockedUsers = []string{"u1", "u2", ""}
	blockedUsersMap = map[string]bool{}

	setupBlockedUsersMap()

	if !blockedUsersMap["u1"] || !blockedUsersMap["u2"] {
		t.Fatalf("expected blocked users to be present, got %#v", blockedUsersMap)
	}
}
