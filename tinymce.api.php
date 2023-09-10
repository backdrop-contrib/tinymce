<?php
/**
 * @file
 * TinyMCE module API documentation.
 */

/**
 * Implements hook_tinymce_external_plugins().
 */
function hook_tinymce_external_plugins($format) {
  $plugins = array(
    // A simple plugin, just declare the path to it.
    'myplugin' => array(
      'plugin_path' => backdrop_get_path('module', 'mymodule') . '/js/plugins/myplugin/plugin.js',
    ),
    // A plugin that needs a special variable (string).
    'myotherplugin' => array(
      'plugin_path' => backdrop_get_path('module', 'mymodule') . '/js/plugins/myotherplugin/plugin.js',
      'variables' => array(
        'myotherpluginSpecialVariable' => _callback_to_get_value_based_on_format($format),
      ),
    ),
  );

  return $plugins;
}

/**
 * Not actually a hook.
 *
 * Editor profiles are config, so you can add your own by adding a JSON file to
 * your active config directory.
 * All files with the prefix 'tinymce.profiles' are available in the admin form
 * in the "Editor profile" select list (admin/config/content/formats/FORMAT).
 *
 * Example: file tinymce.profile.yourown.json
 * @code
 *{
 *    "_config_name": "tinymce.profiles.yourown",
 *    "name": "yourown",
 *    "label": "Your own",
 *
 *  ... rest of the profile settings
 * @endcode
 */