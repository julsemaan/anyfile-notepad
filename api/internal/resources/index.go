package resources

import (
	filestore "github.com/julsemaan/rest-layer-file"
	"github.com/rs/rest-layer/resource"
)

type ContactHooks struct {
	Insert   resource.InsertEventHandler
	Inserted resource.InsertedEventHandler
}

func BuildIndex(directory string, hooks ContactHooks) resource.Index {
	index := resource.NewIndex()

	index.Bind(MimeTypesCollection, MimeTypeSchema(), filestore.NewHandler(directory, MimeTypesCollection, []string{"type_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind(ExtensionsCollection, ExtensionSchema(), filestore.NewHandler(directory, ExtensionsCollection, []string{"name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind(SyntaxesCollection, SyntaxSchema(), filestore.NewHandler(directory, SyntaxesCollection, []string{"ace_js_mode", "display_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	index.Bind(SettingsCollection, SettingSchema(), filestore.NewHandler(directory, SettingsCollection, []string{"var_name"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	contactRequests := index.Bind(ContactRequestsCollection, ContactRequestSchema(), filestore.NewHandler(directory, ContactRequestsCollection, []string{"id"}), resource.Conf{
		AllowedModes: resource.ReadWrite,
	})

	if hooks.Insert != nil {
		contactRequests.Use(hooks.Insert)
	}
	if hooks.Inserted != nil {
		contactRequests.Use(hooks.Inserted)
	}

	return index
}
