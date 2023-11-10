<?php
/**
 * @file
 * TinyMCE profile builder page and forms.
 */

/**
 * TinyMCE profile listing page.
 *
 * @return string
 *   Rendered page content.
 */
function tinymce_profile_listing_page() {
  $profiles = config_get_names_with_prefix('tinymce.profile');
  $default_profiles = array('default', 'full', 'small');
  $items_default = array();
  $items_custom = array();
  $profiles_in_use = _tinymce_profiles_in_use();

  foreach ($profiles as $profile) {
    $config = config($profile);
    $name = $config->get('name');
    $label = $config->get('label');
    if (in_array($name, $default_profiles)) {
      $items_default[] = array(
        'label' => $label,
        'name' => $name,
        'in_use' => array_key_exists($name, $profiles_in_use) ? $profiles_in_use[$name] : '-',
        'actions' => t('Default (module-provided)'),
      );
    }
    else {
      $links = array(
        'edit' => array(
          'title' => t('Edit'),
          'href' => "admin/config/content/tinymce-builder/$name/edit",
        ),
      );
      if (!array_key_exists($name, $profiles_in_use)) {
        $links['delete'] = array(
          'title' => t('Delete'),
          'href' => "admin/config/content/tinymce-builder/$name/delete",
        );
      }
      $items_custom[] = array(
        'label' => check_plain($label),
        'name' => $name,
        'in_use' => array_key_exists($name, $profiles_in_use) ? $profiles_in_use[$name] : '-',
        'links' => array(
          'data' => array(
            '#type' => 'operations',
            '#links' => $links,
          ),
        ),
      );
    }
  }
  $addlink = l(t('Add custom profile'), 'admin/config/content/tinymce-builder/add');
  $content = '<ul class="action-links"><li>' . $addlink . '</li></ul>';
  $content .= theme('table', array(
    'header' => array(t('Label'), t('Machine name'), t('In use'), t('Action')),
    'rows' => array_merge($items_default, $items_custom),
  ));
  $content .= '<p>' . t('Note that it is not recommended to edit profiles customized in code with the admin form. Settings might get lost.') . '</p>';
  return $content;
}

/**
 * Admin form to create or edit custom TinyMCE profiles.
 *
 * @param array $form
 *   Basic form structure.
 * @param array $form_state
 *   Build structure.
 * @param null|Config $profile
 *   Config object or null when creating a new profile.
 *
 * @return array
 */
function tinymce_builder_form(array $form, array &$form_state, $profile = NULL) {
  if ($profile) {
    backdrop_set_title(t('Edit profile %label', array(
      '%label' => $profile->get('label'),
    )), PASS_THROUGH);
  }
  $module_path = backdrop_get_path('module', 'tinymce');
  $form['#attached']['library'][] = array('system', 'ui.sortable');
  $form['#attached']['library'][] = array('system', 'ui.draggable');
  $form['#attached']['js'][] = $module_path . '/js/tinymce-dragdrop.js';
  $form['#attached']['css'][] = $module_path . '/css/tinymce-builder.css';

  $form['label'] = array(
    '#type' => 'textfield',
    '#title' => t('Profile name'),
    '#default_value' => ($profile) ? $profile->get('label') : NULL,
    '#required' => TRUE,
  );
  if ($profile) {
    $form['name'] = array(
      '#type' => 'value',
      '#value' => $profile->get('name'),
    );
  }
  else {
    $form['name'] = array(
      '#type' => 'machine_name',
      '#default_value' => '',
      '#machine_name' => array(
        'exists' => 'tinymce_profile_name_exists',
        'source' => array('label'),
      ),
    );
  }
  $form['set'] = array(
    '#type' => 'fieldset',
    '#title' => t('Settings'),
  );
  $menubar_value = 0;
  if ($profile) {
    $menubar_setting = $profile->get('tiny_options.menubar');
    // Not set means it's enabled, as well as "true".
    if ($menubar_setting === NULL || $menubar_setting === TRUE) {
      $menubar_value = 1;
    }
  }
  $form['set']['use_menu'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use menubar'),
    '#default_value' => $menubar_value,
    '#description' => t('Provides a dropdown menu above the toolbar.'),
  );
  $autoresize_value = 1;
  if ($profile) {
    $plugin_setting_string = $profile->get('tiny_options.plugins');
    if (strpos($plugin_setting_string, 'autoresize') === FALSE) {
      $autoresize_value = 0;
    }
  }
  $form['set']['autoresize'] = array(
    '#type' => 'checkbox',
    '#title' => t('Use autoresize'),
    '#default_value' => $autoresize_value,
    '#description' => t('Lets the editor height automatically increase with its content.'),
  );

  $icons = _tinymce_collect_icons();
  $buttons = _tinymce_get_button_defs();
  $toolbar_default = ($profile) ? $profile->get('tiny_options.toolbar') : config_get('tinymce.profiles.default', 'tiny_options.toolbar');
  $toolbar_default_buttons = explode(' ', $toolbar_default);

  $button_list = '';
  foreach ($buttons as $name => $data) {
    if (in_array($name, $toolbar_default_buttons)) {
      continue;
    }
    $button_list .= _tinymce_build_buttonlist_item($data, $icons, $name);
  }

  $default_button_list = '';
  $attributes = array(
    'class' => 'tinybutton separator',
    'tabindex' => '0',
    'title' => t('Separator'),
    'aria-label' => t('Separator'),
  );
  $separator_item = '<li' . backdrop_attributes($attributes) . '>&nbsp;</li>';
  foreach ($toolbar_default_buttons as $name) {
    if ($name == '|') {
      $default_button_list .= $separator_item;
      continue;
    }
    if (isset($buttons[$name])) {
      $default_button_list .= _tinymce_build_buttonlist_item($buttons[$name], $icons, $name);
    }
    else {
      $placeholder = array(
        'icon' => 'temporary-placeholder',
        'tooltip' => $name . ' (?)',
      );
      $default_button_list .= _tinymce_build_buttonlist_item($placeholder, $icons, $name);
    }
  }

  $form['tb'] = array(
    '#type' => 'fieldset',
    '#title' => t('Toolbar items'),
    '#attributes' => array(
      'role' => 'application',
      'aria-describedby' => 'builder-keyboard-help',
    ),
    '#description' => t('Drag desired buttons to the "Active" list, drag unwanted ones to the "Available" list below.'),
  );
  $form['tb']['toolbar'] = array(
    '#type' => 'textarea',
    '#title' => t('Toolbar items'),
    '#title_display' => 'invisible',
    '#default_value' => $toolbar_default,
    '#attributes' => array(
      'style' => 'display: none',
    ),
    '#resizable' => FALSE,
  );
  $form['tb']['active'] = array(
    '#type' => 'markup',
    '#markup' => _tinymce_build_active_list_wrapper($default_button_list),
  );
  $form['tb']['available'] = array(
    '#type' => 'markup',
    '#markup' => _tinymce_build_available_list_wrapper($button_list, $separator_item),
  );
  $kbd_help = t('Use <em>tab</em> to navigate, left and right arrow keys to move buttons in active toolbar, the <em>-</em> key to remove, the <em>+</em> key in the avialable list to add to the active list.');
  $markup = '<div class="element-invisible" id="builder-keyboard-help">' . $kbd_help . '</div>';
  $markup .= '<div class="element-invisible" id="announce-addremove" aria-live="polite"></div>';
  $form['tb']['keyboard_help'] = array(
    '#type' => 'markup',
    '#markup' => $markup,
  );

  $form['actions'] = array(
    '#type' => 'actions',
  );
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save profile'),
  );
  if ($profile) {
    $profiles_in_use = _tinymce_profiles_in_use();
    $name = $profile->get('name');
    if (!array_key_exists($name, $profiles_in_use)) {
      $form['actions']['delete'] = array(
        '#type' => 'link',
        '#title' => t('Delete'),
        '#href' => "admin/config/content/tinymce-builder/$name/delete",
        '#options' => array(
          'attributes' => array(
            'class' => array(
              'button', 'button-secondary', 'form-delete',
            ),
          ),
        ),
      );
    }
  }
  $form['actions']['cancel'] = array(
    '#type' => 'link',
    '#title' => t('Cancel'),
    '#href' => 'admin/config/content/tinymce-builder',
  );

  return $form;
}

/**
 * Helper function to build a list item for draggable button lists.
 *
 * @param array $data
 *   Button item, key-value pairs.
 * @param array $icons
 *   Icon list, key-value pair of name and SVG content.
 * @param string $button_name
 *   Button name.
 *
 * @return string
 */
function _tinymce_build_buttonlist_item(array $data, array $icons, $button_name) {
  $label = $button_name;
  $tooltip = '';
  if (isset($data['icon'])) {
    $icon_name = $data['icon'];
    if (isset($icons[$icon_name])) {
      $label = $icons[$icon_name];
    }
  }
  elseif (isset($data['text'])) {
    $label = filter_xss_admin($data['text']);
  }
  $attributes = array(
    'draggable' => 'true',
    'class' => 'tinybutton',
    'id' => $button_name,
    'title' => isset($data['tooltip']) ? $data['tooltip'] : '',
    'tabindex' => '0',
    'aria-label' => isset($data['tooltip']) ? $data['tooltip'] : $button_name,
  );
  return '<li' . backdrop_attributes($attributes) . '>' . $label . '</li>';
}

/**
 * Helper function to wrap button lists in markup.
 *
 * @param string $button_list
 *   Markup of buttons list to wrap.
 * @param string $separator_item
 *   Markup of separator item to wrap.
 *
 * @return string
 */
function _tinymce_build_available_list_wrapper($button_list, $separator_item) {
  $markup = '<div><strong>' . t('Available') . ':</strong></div>';
  $markup .= '<div class="wrapper">';
  $markup .= '<ul id="buttons-available">' . $button_list . '</ul>';
  $markup .= '<ul id="buttons-space">' . $separator_item . '</ul>';
  $markup .= '</div>';
  return $markup;
}

/**
 * Helper function to wrap button list in markup.
 *
 * @param string $default_button_list
 *   Markup of buttons list to wrap.
 *
 * @return string
 */
function _tinymce_build_active_list_wrapper($default_button_list) {
  $markup = '<div><strong>' . t('Active') . ':</strong></div>';
  $markup .= '<div class="wrapper">';
  $markup .= '<ul id="buttons-active">' . $default_button_list . '</ul>';
  $markup .= '</div>';
  return $markup;
}

/**
 * Helper function to find TinyMCE profiles in use in any format.
 *
 * @return array
 *   Associative array keyed by profile name.
 */
function _tinymce_profiles_in_use() {
  $all_formats = config_get_names_with_prefix('filter.format.');;
  $profiles_in_use = array();
  foreach ($all_formats as $name) {
    $config = config($name);
    if ($editor = $config->get('editor')) {
      if ($editor != 'tinymce') {
        continue;
      }
      $format_machinename = $config->get('format');
      $format_humanname = $config->get('name');
      $format_link = l(check_plain($format_humanname), "admin/config/content/formats/$format_machinename");
      $profile_machinename = $config->get('editor_settings.tinymce_settings.profile');
      if (array_key_exists($profile_machinename, $profiles_in_use)) {
        $profiles_in_use[$profile_machinename] .= ', ' . $format_link;
      }
      else {
        $profiles_in_use[$profile_machinename] = $format_link;
      }
    }
  }
  return $profiles_in_use;
}

/**
 * Submission handler for tinymce_builder_form().
 */
function tinymce_builder_form_submit(array $form, array &$form_state) {
  form_state_values_clean($form_state);
  $filter_allowlist = array();
  $plugins = array();

  $buttons = _tinymce_get_button_defs();
  $active_buttons = explode(' ', $form_state['values']['toolbar']);
  foreach ($active_buttons as $button) {
    if ($button == '|') {
      continue;
    }
    if (isset($buttons[$button])) {
      $info = $buttons[$button];
      if (isset($info['required_tags'])) {
        $filter_allowlist = array_merge($filter_allowlist, array_values($info['required_tags']));
      }
      if (isset($info['plugin'])) {
        $plugins[] = $info['plugin'];
      }
    }
  }
  // We always need these, even if no button requires them:
  $filter_allowlist[] = 'p';
  $filter_allowlist[] = 'br';
  $allow_tags = implode(',', array_unique($filter_allowlist));

  $config = config('tinymce.profiles.' . $form_state['values']['name']);
  if ($config->isNew()) {
    $config->set('name', $form_state['values']['name']);
  }
  $config->set('label', $form_state['values']['label']);
  $config->set('filter_allowed_html', $allow_tags);

  $tiny_options = array();
  if (!$config->isNew()) {
    $tiny_options = $config->get('tiny_options');
  }
  if (!$form_state['values']['use_menu']) {
    $tiny_options['menubar'] = FALSE;
  }
  else {
    unset($tiny_options['menubar']);
  }
  if ($form_state['values']['autoresize']) {
    $plugins[] = 'autoresize';
  }
  $tiny_options['toolbar'] = $form_state['values']['toolbar'];
  $tiny_options['plugins'] = implode(' ', array_unique($plugins));
  $contextmenu = array();
  if (in_array('backdropimage', $plugins)) {
    $contextmenu[] = 'backdropimage';
  }
  if (in_array('backdroplink', $plugins)) {
    $contextmenu[] = 'backdroplink';
  }
  if (!empty($contextmenu)) {
    $tiny_options['contextmenu'] = implode(' ', $contextmenu);
  }
  $config->set('tiny_options', $tiny_options);
  $config->save();

  $form_state['redirect'] = 'admin/config/content/tinymce-builder';
  backdrop_set_message(t('The profile %profile has been saved.', array(
    '%profile' => $form_state['values']['label'],
  )));
}

/**
 * Form callback to delete a TinyMCE profile.
 */
function tinymce_builder_delete_confirm(array $form, array &$form_state, $profile) {
  backdrop_set_title(t('Delete profile %label', array(
    '%label' => $profile->get('label'),
  )), PASS_THROUGH);
  $name = $profile->get('name');
  $profiles_in_use = _tinymce_profiles_in_use();
  $form['profile'] = array(
    '#type' => 'value',
    '#value' => $name,
  );
  $form['info'] = array(
    '#type' => 'markup',
    '#markup' => '<p>' . t('This action cannot be undone.') . '</p>',
  );
  $form['actions']['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Delete'),
    '#attributes' => array(
      'class' => array('button-danger'),
    ),
    '#disabled' => array_key_exists($name, $profiles_in_use),
  );
  $form['actions']['cancel'] = array(
    '#type' => 'link',
    '#title' => t('Cancel'),
    '#href' => 'admin/config/content/tinymce-builder',
  );
  return $form;
}

/**
 * Submission callback to delete a TinyMCE profile.
 */
function tinymce_builder_delete_confirm_submit(array $form, array &$form_state) {
  $name = $form_state['values']['profile'];
  $config = config("tinymce.profiles.$name");
  $config->delete();
  $form_state['redirect'] = 'admin/config/content/tinymce-builder';
  backdrop_set_message('The profile has been deleted.');
}

/**
 * Helper function to check if a config name already exists.
 *
 * @param string $name
 *   Profile name to check.
 *
 * @return bool
 */
function tinymce_profile_name_exists($name) {
  $existing = array();
  $config_names = config_get_names_with_prefix('tinymce.profiles.');
  foreach ($config_names as $config_name) {
    $parts = explode('.', $config_name);
    $existing[] = end($parts);
  }
  return in_array($name, $existing);
}

/**
 * Helper function to return structured info about buttons.
 *
 * @return array
 */
function _tinymce_get_button_defs() {
  $buttons = array(
    // Open Source plugins that ship with TinyMCE, some excluded.
    'accordion' => array(
      'icon' => 'accordion',
      'tooltip' => t('Insert accordion'),
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'accordiontoggle' => array(
      'icon' => 'accordion-toggle',
      'tooltip' => t('Toggle accordion'),
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'accordionremove' => array(
      'icon' => 'remove',
      'tooltip' => t('Delete accordion'),
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'numlist' => array(
      'icon' => 'ordered-list',
      'tooltip' => t('Numbered list'),
      'plugin' => 'lists',
      'required_tags' => array('ul', 'ol', 'li'),
    ),
    'bullist' => array(
      'icon' => 'unordered-list',
      'tooltip' => t('Bullet list'),
      'plugin' => 'lists',
      'required_tags' => array('ul', 'ol', 'li'),
    ),
    'charmap' => array(
      'icon' => 'insert-character',
      'tooltip' => t('Special character'),
      'plugin' => 'charmap',
    ),
    'code' => array(
      'icon' => 'sourcecode',
      'tooltip' => t('Source code'),
      'plugin' => 'code',
    ),
    'codesample' => array(
      'icon' => 'code-sample',
      'tooltip' => t('Insert/edit code sample'),
      'plugin' => 'codesample',
      'required_tags' => array('pre', 'code'),
    ),
    'emoticons' => array(
      'icon' => 'emoji',
      'tooltip' => t('Emojis'),
      'plugin' => 'emoticons',
    ),
    'fullscreen' => array (
      'icon' => 'fullscreen',
      'tooltip' => t('Fullscreen'),
      'plugin' => 'fullscreen',
    ),
    'help' => array(
      'icon' => 'help',
      'tooltip' => t('Help'),
      'plugin' => 'help',
    ),
    'insertdatetime' => array(
      'icon' => 'insert-time',
      'tooltip' => t('Insert date/time'),
      'plugin' => 'insertdatetime',
    ),
    'searchreplace' => array(
      'icon' => 'search',
      'tooltip' => t('Find and replace'),
      'plugin' => 'searchreplace',
    ),
    'table' => array(
      'icon' => 'table',
      'tooltip' => t('Table'),
      'plugin' => 'table',
      'required_tags' => array(
        'table', 'tr', 'th', 'td', 'caption', 'thead',
        'tbody', 'tfoot', 'colgroup', 'col',
      ),
    ),
    'visualblocks' => array(
      'icon' => 'visualblocks',
      'tooltip' => t('Show blocks'),
      'plugin' => 'visualblocks',
    ),
    'visualchars' => array(
      'icon' => 'visualchars',
      'tooltip' => t('Show invisible characters'),
      'plugin' => 'visualchars',
    ),
    'wordcount' => array(
      'icon' => 'character-count',
      'tooltip' => t('Word count'),
      'plugin' => 'wordcount',
    ),
    // Buttons provided by TinyMCE core.
    'alignleft' => array(
      'icon' => 'align-left',
      'tooltip' => t('Align left'),
    ),
    'aligncenter' => array(
      'icon' => 'align-center',
      'tooltip' => t('Align center'),
    ),
    'alignright' => array(
      'icon' => 'align-right',
      'tooltip' => t('Align right'),
    ),
    'alignjustify' => array(
      'icon' => 'align-justify',
      'tooltip' => t('Justify'),
    ),
    'alignnone' => array(
      'icon' => 'align-none',
      'tooltip' => t('No alignment'),
    ),
    'bold' => array(
      'icon' => 'bold',
      'tooltip' => t('Bold'),
      'required_tags' => array('strong'),
    ),
    'italic' => array(
      'icon' => 'italic',
      'tooltip' => t('Italic'),
      'required_tags' => array('em'),
    ),
    'underline' => array(
      'icon' => 'underline',
      'tooltip' => t('Underline'),
      'required_tags' => array('u'),
    ),
    'strikethrough' => array(
      'icon' => 'strike-through',
      'tooltip' => t('Strikethrough'),
      'required_tags' => array('s'),
    ),
    'subscript' => array(
      'icon' => 'subscript',
      'tooltip' => t('Subscript'),
      'required_tags' => array('sub'),
    ),
    'superscript' => array(
      'icon' => 'superscript',
      'tooltip' => t('Superscript'),
      'required_tags' => array('sup'),
    ),
    'copy' => array(
      'icon' => 'copy',
      'tooltip' => t('Copy'),
    ),
    'selectall' => array(
      'icon' => 'select-all',
      'tooltip' => t('Select all'),
    ),
    'print' => array(
      'icon' => 'print',
      'tooltip' => t('Print'),
    ),
    'cut' => array(
      'icon' => 'cut',
      'tooltip' => t('Cut'),
    ),
    'paste' => array(
      'icon' => 'paste',
      'tooltip' => t('Paste'),
    ),
    'removeformat' => array(
      'icon' => 'remove-formatting',
      'tooltip' => t('Clear formatting'),
    ),
    'remove' => array(
      'icon' => 'remove',
      'tooltip' => t('Remove'),
    ),
    'hr' => array(
      'icon' => 'horizontal-rule',
      'tooltip' => t('Horizontal line'),
      'required_tags' => array('hr'),
    ),
    'blockquote' => array(
      'icon' => 'quote',
      'tooltip' => t('Blockquote'),
      'required_tags' => array('blockquote', 'cite'),
    ),
    'undo' => array(
      'icon' => 'undo',
      'tooltip' => t('Undo'),
    ),
    'redo' => array(
      'icon' => 'redo',
      'tooltip' => t('Redo'),
    ),
    'visualaid' => array(
      'text' => 'Visual aids',
      'tooltip' => t('Visual aids'),
    ),
    'outdent' => array(
      'icon' => 'outdent',
      'tooltip' => t('Decrease indent'),
    ),
    'indent' => array(
      'icon' => 'indent',
      'tooltip' => t('Increase indent'),
    ),
    'pastetext' => array(
      'icon' => 'paste-text',
      'tooltip' => t('Paste as text'),
    ),
    // This is actually a nested menu item, not a button.
    'styles' => array(
      'text' => 'Styles&nbsp;▾',
      'tooltip' => t('Styles dropdown'),
      'required_tags' => array(
        'h2', 'h3', 'h4', 'h5',
        'strong', 'em', 'u', 's', 'code',
        'p', 'blockquote', 'div', 'pre',
      ),
    ),
  );

  // Collect buttons from plugins defined via hook_tinymce_external_plugins().
  $external_plugins = _tinymce_get_external_plugins();
  foreach ($external_plugins as $plugin_name => $data) {
    if (!isset($data['buttons'])) {
      continue;
    }
    $plugin_buttons = $data['buttons'];
    foreach ($plugin_buttons as $button_name => $button_data) {
      $button_data['plugin'] = $plugin_name;
      $buttons[$button_name] = $button_data;
    }
  }

  return $buttons;
}

/**
 * Helper function to collect icons from editor and custom ones.
 *
 * @return array
 */
function _tinymce_collect_icons() {
  global $base_path;
  $module_path = backdrop_get_path('module', 'tinymce');
  // Big JSON file, generated with:
  // tinymce.activeEditor.ui.registry.getAll().icons
  $icon_file = $module_path . '/builder-data/icons.json';
  $icon_data = file_get_contents($icon_file);
  if (!$icon_data) {
    backdrop_set_message(t('Loading icon data failed.'), 'error');
    return array();
  }
  $icons = json_decode($icon_data, TRUE);

  // Also collect custom icons provided by plugins.
  $external_plugins = _tinymce_get_external_plugins();
  foreach ($external_plugins as $name => $plugin) {
    if (empty($plugin['icons'])) {
      continue;
    }
    $url = dirname($plugin['plugin_path']);
    foreach ($plugin['icons'] as $icon_name => $file) {
      if (file_get_mimetype($file) != 'image/svg+xml') {
        continue;
      }
      $rel_path = substr($url, strlen($base_path)) . '/icons/' . $file;
      if ($icon_data = file_get_contents($rel_path)) {
        $icons[$icon_name] = $icon_data;
      }
    }
  }
  return $icons;
}

/**
 * Helper funtion to collect external plugins defined via hook.
 *
 * @return array
 */
function _tinymce_get_external_plugins() {
  $external_plugins = &backdrop_static(__FUNCTION__);
  if (!isset($external_plugins)) {
    global $user;
    $formats = filter_formats($user);
    $dummy_format = reset($formats);
    $external_plugins = module_invoke_all('tinymce_external_plugins', $dummy_format);
  }
  return $external_plugins;
}
