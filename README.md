# TinyMCE

Integrates [TinyMCE](https://www.tiny.cloud/) as alternative WYSIWYG editor in
Backdrop CMS.

![Screenshot of the full profile](https://raw.githubusercontent.com/backdrop-contrib/tinymce/1.x-1.x/screenshots/tinymce-full-profile.webp)

This module can co-exist with CKEditor, you can also toggle on-the-fly
 in node forms, although having both editors turned on might have side effects
 on page performance.

### Why another WYSIWYG editor?

Because CKEditor might eventually not be the ideal solution for your site,
 especially beginning with its version 5. This integration module is
 supposed to be a drop-in replacement for core's CKEditor module.

## Installation

- Install this module using the official [Backdrop CMS instructions](https://docs.backdropcms.org/documentation/extend-with-modules)
- Visit the Text Editors and Formats page under Administration > Configuration > Content authoring (admin/config/content/formats)
- Create or edit a format. In the "Editor" dropdown, select "TinyMCE"
- Optionally switch the profile and add custom content CSS URLs
- Optionally toggle image or file upload and adapt settings

If none of the three default profiles meets your needs, you can create
 custom ones with the **builder tool**. Go to admin/config/content/tinymce-builder
 to create a custom profile via drag-and-drop with the buttons you need.

Find additional documentation in the [wiki](https://github.com/backdrop-contrib/tinymce/wiki).

## Extending with plugins

By default TinyMCE already ships with [lots of plugins](https://www.tiny.cloud/docs/tinymce/latest/plugins/#open-source-plugins).
And it's integrated well in Backdrop CMS with its media handling.

But there's more:

- [TinyMCE snippets](https://backdropcms.org/project/tinymce_snippets)
  (Insert pre-defined HTML snippets into content, using a dialog)
- [TinyMCE paragraph after](https://backdropcms.org/project/tinymce_paraafter)
  (Insert a new paragraph after block level elements)
- [TinyMCE IMCE](https://backdropcms.org/project/tinymce_imce)
  (Integration with the IMCE uploader and browser)
- [TinyMCE File Link](https://backdropcms.org/project/tinymce_filelink)
  (File browser to search and insert links to files in content)
- [TinyMCE JavaScript Accordions](https://backdropcms.org/project/tinymce_js_accordion)
  (Animated accordions based on description lists)
- [TinyMCE Paging](https://backdropcms.org/project/tinymce_paging)
  (Provides an button to insert page breaks used by the Paging module)
- [TinyMCE Code Highlight](https://backdropcms.org/project/tinymce_codehighlight)
  (Adds tweaks for the codesample plugin, adds syntax highlighting on content display)
- [Video Filter](https://backdropcms.org/project/video_filter) since
  version 1.x-3.5.0 (embed any type of video in your site using a simple tag)
- [File Entity Embed Filter](https://backdropcms.org/project/feef)
  (Embed file entities in content using a token-like placeholder)
- Compatible with the [Editor Image Dimension Sync](https://backdropcms.org/project/editorimgdimensionsync)
  module. (Enhances the editor image selection dialog.)

And if that's not enough, it's not hard to add custom ones by leveraging
 hook_tinymce_external_plugins(). See the
 [API example](https://github.com/backdrop-contrib/tinymce/blob/1.x-1.x/tinymce.api.php#L10) for details.

## Issues

Bugs and feature requests should be reported in the [Issue Queue](https://github.com/backdrop-contrib/tinymce/issues)

## Release frequency

As the library ships with the module, there are regular updates to keep up with their releases.
Currently roughly once a month.

This frequency may eventually change in the future, but the plan is to not fall behind too far.

## Current Maintainers

- [Indigoxela](https://github.com/indigoxela)

## Credits

Bundles the versatile [TinyMCE](https://www.tiny.cloud/) JavaScript library,
maintained with <3 by Ephox Corporation DBA Tiny Technologies, Inc.
Licensed under the terms of GNU General Public License Version 2 or later
beginning with its version 7.0 (used to be MIT with version 6).

The editor has been around for two decades and is one of the most used
Open Source JavaScript based WYSIWYG editors, integrated in many projects.


## License

This project is GPL v2 software. See the LICENSE.txt file in this directory for complete text.
