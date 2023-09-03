so cool, dynamic dark mode eingebaut...
https://www.tiny.cloud/docs/tinymce/6/customize-ui/

auch spannend:
https://www.tiny.cloud/docs/tinymce/6/autocompleter/

übersicht:
https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.editor.ui.registry/
(addonmanager ist die base class von pluginmanager)


uuuuund hier ist die lösung für das welches-format problem!!!

editor.options.register('custom_option', {
  processor: 'string',
  default: 'myoption'
});

// Lookup an option
editor.options.get('custom_option');

// Set an option
editor.options.set('custom_option', 'value');

da kann ich zeuch reinstopfen!


NICE, aber nicht sicher, ob's was bringt:
https://www.toptal.com/developers/javascript-minifier
