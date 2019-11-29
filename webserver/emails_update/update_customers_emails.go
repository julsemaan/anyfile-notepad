package main

import (
	"fmt"
	"os"
	"regexp"

	stripe "github.com/stripe/stripe-go"
	"github.com/stripe/stripe-go/customer"
)

var reEmailFromDesc = regexp.MustCompile(`Customer for Google email: (.*)`)

func main() {
	stripe.Key = os.Getenv("STRIPE_SK")

	params := &stripe.CustomerListParams{}
	params.Filters.AddFilter("limit", "", "100")
	i := customer.List(params)

	if i.Err() != nil {
		panic("ERROR: Unable to load customers")
	}

	count := 0
	for i.Next() {
		count += 1
		c := i.Customer()
		if c.Meta["google_email"] == "" {
			fmt.Printf("Found customer (%s) without google_email metadata, will update it from description \n", c.Desc)
			matches := reEmailFromDesc.FindAllStringSubmatch(c.Desc, -1)
			if len(matches) != 1 {
				panic("Failed to find email from description " + c.Desc)
			}
			customerParams := &stripe.CustomerParams{}
			customerParams.AddMeta("google_email", matches[0][1])
			_, err := customer.Update(c.ID, customerParams)
			if err != nil {
				panic("Error while updating customer " + c.Desc + ". ERROR: " + err.Error())
			}
		}
	}

}
