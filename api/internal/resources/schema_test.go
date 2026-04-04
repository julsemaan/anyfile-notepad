package resources

import "testing"

func TestEmailValidatorValidate(t *testing.T) {
	validator := emailValidator{}

	t.Run("accepts valid email", func(t *testing.T) {
		value, err := validator.Validate("john.doe@example.com")
		if err != nil {
			t.Fatalf("expected valid email, got error: %v", err)
		}
		if value != "john.doe@example.com" {
			t.Fatalf("expected preserved email, got %#v", value)
		}
	})

	testCases := []struct {
		name  string
		input interface{}
	}{
		{name: "non email value", input: "not-an-email"},
		{name: "crlf injection", input: "john.doe@example.com\r\nBcc:evil@example.com"},
		{name: "embedded whitespace", input: "john doe@example.com"},
		{name: "non string value", input: 123},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if _, err := validator.Validate(testCase.input); err == nil {
				t.Fatalf("expected invalid input %#v to be rejected", testCase.input)
			}
		})
	}
}
