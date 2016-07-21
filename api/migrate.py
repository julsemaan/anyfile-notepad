
import json
import requests

connection_string = "http://super:man@localhost:8080"

with open('mime_types.json', 'r') as f:
    mime_types = json.load(f)
with open('extensions.json', 'r') as f:
    extensions = json.load(f)
with open('syntaxes.json', 'r') as f:
    syntaxes = json.load(f)

mime_types_id2uid = {}
syntaxes_id2uid = {}

for mime_type in mime_types:
    id = mime_type['id']
    mime_type.pop('id', None)
    r = requests.post(connection_string+'/mime_types', data = json.dumps(mime_type))
    new_mime_type = json.loads(r.text)
    mime_types_id2uid[id] = new_mime_type['id']

for syntax in syntaxes:
    id = syntax['id']
    syntax.pop('id', None)
    r = requests.post(connection_string+'/syntaxes', data = json.dumps(syntax))
    new_syntax = json.loads(r.text)
    syntaxes_id2uid[id] = new_syntax['id']

for extension in extensions:
    id = extension['id']
    mime_type_id = extension['mime_type_id']
    syntax_id = extension['syntax_id']
    extension.pop('id', None)
    extension.pop('mime_type_id', None)
    extension.pop('syntax_id', None)

    mime_type_uid = mime_types_id2uid[mime_type_id]
    syntax_uid = syntaxes_id2uid[syntax_id]

    if mime_type_uid is None or syntax_uid is None:
        raise "Can't find mime type(%s) + syntax(%s) for extension : %s" (mime_type_uid, syntax_uid, id)
    else:
        extension['mime_type_id'] = mime_type_uid
        extension['syntax_id'] = syntax_uid

    r = requests.post(connection_string+'/extensions', data = json.dumps(extension))
    new_extension = json.loads(r.text)
