<?php
/**
 * @file
 * TinyMCE module API documentation.
 */

/**
 * Implements hook_tinymce_external_plugins().
 */
function hook_tinymce_external_plugins($format) {
  $module_url = base_path() . backdrop_get_path('module', 'mymodule');
  $plugins = array(
    // A simple plugin, just declare the path to it.
    'myplugin' => array(
      'plugin_path' => $module_url . '/js/plugins/myplugin/plugin.js',
    ),
    // Another plugin, with a button and a custom icon.
    'myfancyplugin' => array(
      'plugin_path' => $module_url . '/js/plugins/myfancyplugin/plugin.js',
      // Provide info for the builder tool about buttons, this plugin provides.
      // For the builder tool to provide a drag-and-drop handle.
      'buttons' => array(
        'mypluginbutton' => array(
          'icon' => 'myfancyicon',
          'tooltip' => 'My plugin button',
          'required_tags' => array('span'),
        ),
      ),
      // This plugin also ships with a custom icon. The icon name is the key,
      // the icon filename is the value. This file has to be in a directory
      // named "icons", next to the plugin's js file.
      // Relevant for the builder and also for the actual editor appearance.
      // Not necessary if you only use icons from default icon set.
      'icons' => array(
        'myfancyicon' => 'mysvgfile.svg',
      ),
    ),
    // A plugin that needs a special variable (string).
    'myotherplugin' => array(
      'plugin_path' => $module_url . '/js/plugins/myotherplugin/plugin.js',
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
