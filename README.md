# TinyMCE

Integrates [TinyMCE](https://www.tiny.cloud/) as alternative WYSIWYG editor in
Backdrop CMS.

![Screenshot of the full profile](https://raw.githubusercontent.com/backdrop-contrib/tinymce/1.x-1.x/screenshots/tinymce-full-profile.webp)

This module is in an early stage of development. Testing and feedback is
 welcome, but it's not ready for productions sites, yet.

Documentation is still pending, help with that task is highly appreciated!

*Note:* this module can co-exist with CKEditor, you can also toggle on-the-fly
 in node forms, although having both editors turned on might have side effects
 on page performance.

Compatible with the [Editor Image Dimension Sync](https://backdropcms.org/project/editorimgdimensionsync)
 module.

### Why another WYSIWYG editor?

Because CKEditor might eventually not be the ideal solution for your site,
 especially its version 5.

## Installation

- Install this module using the official [Backdrop CMS instructions](https://docs.backdropcms.org/documentation/extend-with-modules)
- Visit the Text Editors and Formats page under Administration > Configuration > Content authoring (admin/config/content/formats)
- Create or edit a format. In the "Editor" dropdown, select "TinyMCE"
- Optionally select a profile and add custom content CSS URLs
- Optionally enable image or file upload and adapt settings

## Issues

Bugs and feature requests should be reported in the [Issue Queue](https://github.com/backdrop-contrib/tinymce/issues)

## Known issues

There's currently no builder tool for custom editor profiles. This module ships
 with three variants. But as it's simple JSON config, it might not be too hard
 to derive your own custom profile.

As this integration module is new, there are currently no enhancing plugins
 available, yet (for Backdrop CMS).

## Current Maintainers

- [Indigoxela](https://github.com/indigoxela)

## Credits

Bundles the versatile [TinyMCE](https://www.tiny.cloud/) JavaScript library
(MIT licensed).

## License

This project is GPL v2 software. See the LICENSE.txt file in this directory for complete text.
