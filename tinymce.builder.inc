<?php
/**
 * @file
 * TinyMCE profile builder form.
 */

/**
 * Admin form to create custom TinyMCE profiles.
 */
function tinymce_builder_form($form, &$form_state) {
  $form = array();
  $module_path = backdrop_get_path('module', 'tinymce');
  $form['#attached']['library'][] = array('system', 'ui.sortable');
  $form['#attached']['library'][] = array('system', 'ui.draggable');
  $form['#attached']['js'][] = $module_path . '/js/tinymce-dragdrop.js';
  $form['#attached']['css'][] = $module_path . '/css/tinymce-builder.css';

  $form['label'] = array(
    '#type' => 'textfield',
    '#title' => t('Profile name'),
    '#default_value' => '',
    '#required' => TRUE,
  );
  $form['name'] = array(
    '#type' => 'machine_name',
    '#default_value' => '',
    '#machine_name' => array(
      'exists' => 'tinymce_profile_name_exists',
      'source' => array('label'),
    ),
  );

  // Big JSON file, generated with:
  // tinymce.activeEditor.ui.registry.getAll().icons
  $icon_file = $module_path . '/builder-data/icons.json';
  $icon_data = file_get_contents($icon_file);
  $icons = json_decode($icon_data, TRUE);
  $buttons = _tinymce_get_button_defs();
  $toolbar_default = config_get('tinymce.profiles.default', 'tiny_options.toolbar');
  $toolbar_default_buttons = explode(' ', $toolbar_default);

  $button_list = '';
  foreach ($buttons as $name => $data) {
    if (in_array($name, $toolbar_default_buttons)) {
      continue;
    }
    $button_list .= _tinymce_build_buttonlist_item($data, $icons, $name);
  }

  $default_button_list = '';
  $separator_item = '<li class="tinybutton separator" title="Separator">&nbsp;</li>';
  foreach ($toolbar_default_buttons as $name) {
    if ($name == '|') {
      $default_button_list .= $separator_item;
      continue;
    }
    if (isset($buttons[$name])) {
      $default_button_list .= _tinymce_build_buttonlist_item($buttons[$name], $icons, $name);
    }
  }

  $form['menu'] = array(
    '#type' => 'fieldset',
    '#title' => t('Menu bar'),
  );
  $form['menu']['use_menu'] = array(
    '#type' => 'checkbox',
    '#title' => 'Use menubar',
    '#default_value' => 0,
  );
  $form['tb'] = array(
    '#type' => 'fieldset',
    '#title' => t('Toolbar items'),
    '#attributes' => array(
      'role' => 'application',// @todo what is needed for A11Y?
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
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => t('Save profile'),
  );
  return $form;
}

/**
 * Helper function to build a list item for draggable button lists.
 */
function _tinymce_build_buttonlist_item(array $data, array $icons, $button_name) {
  $label = $button_name;
  $tooltip = '';
  if (isset($data['icon'])) {
    $icon_name = $data['icon'];// @todo !! SVG
    if (isset($icons[$icon_name])) {
      $label = $icons[$icon_name];
    }
  }
  elseif (isset($data['text'])) {
    $label = filter_xss_admin($data['text']);
  }
  if (isset($data['tooltip'])) {
    $tooltip = check_plain($data['tooltip']);
  }
  return '<li draggable="true" class="tinybutton" id="' . $button_name . '" title="' . $tooltip . '">' . $label . '</li>';
}

/**
 * Helper function to wrap button lists in markup.
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
 */
function _tinymce_build_active_list_wrapper($default_button_list) {
  $markup = '<div><strong>' . t('Active') . ':</strong></div>';
  $markup .= '<div class="wrapper">';
  $markup .= '<ul id="buttons-active">' . $default_button_list . '</ul>';
  $markup .= '</div>';
  return $markup;
}

/**
 * Submission handler for tinymce_builder_form().
 */
function tinymce_builder_form_submit($form, &$form_state) {
  form_state_values_clean($form_state);
  $filter_allowlist = array();
  $plugins = array();

  $buttons = _tinymce_get_button_defs();
  $active_buttons = explode(' ', $form_state['values']['toolbar']);
  foreach ($active_buttons as $button) {
    if ($button == '|') {
      continue;
    }
    $info = $buttons[$button];
    if (isset($info['required_tags'])) {
      $filter_allowlist = array_merge($filter_allowlist, array_values($info['required_tags']));
    }
    if (isset($info['plugin'])) {
      $plugins[] = $info['plugin'];
    }
  }
  $allow_tags = implode(',', array_unique($filter_allowlist));

  $config = config('tinymce.profiles.' . $form_state['values']['name']);
  $config->set('name', $form_state['values']['name']);
  $config->set('label', $form_state['values']['label']);
  $config->set('filter_allowed_html', $allow_tags);

  $tiny_options = array();
  if (!$form_state['values']['use_menu']) {
    $tiny_options['menubar'] = FALSE;
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

  $form_state['redirect'] = 'admin/config/content/formats';
  backdrop_set_message(t('The profile %profile has been saved.', array(
    '%profile' => $form_state['values']['label'],
  )));
}

/**
 * Helper function to check if a config name already exists.
 */
function tinymce_profile_name_exists($name) {
  // @todo maybe check all configs?
  $module_provided = array('default', 'full', 'small');
  return in_array($name, $module_provided);
}

/**
 * Helper function to return structured info about buttons.
 */
function _tinymce_get_button_defs() {
  $buttons = array(
    // Open Source plugins that ship with TinyMCE, some excluded.
    'accordion' => array(
      'icon' => 'accordion',
      'tooltip' => 'Insert accordion',
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'accordiontoggle' => array(
      'icon' => 'accordion-toggle',
      'tooltip' => 'Toggle accordion',
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'accordionremove' => array(
      'icon' => 'remove',
      'tooltip' => 'Delete accordion',
      'plugin' => 'accordion',
      'required_tags' => array('details', 'summary'),
    ),
    'numlist' => array(
      'icon' => 'ordered-list',
      'tooltip' => 'Numbered list',
      'plugin' => 'lists',
      'required_tags' => array('ul', 'ol', 'li'),
    ),
    'bullist' => array(
      'icon' => 'unordered-list',
      'tooltip' => 'Bullet list',
      'plugin' => 'lists',
      'required_tags' => array('ul', 'ol', 'li'),
    ),
    'charmap' => array(
      'icon' => 'insert-character',
      'tooltip' => 'Special character',
      'plugin' => 'charmap',
    ),
    'code' => array(
      'icon' => 'sourcecode',
      'tooltip' => 'Source code',
      'plugin' => 'code',
    ),
    'codesample' => array(
      'icon' => 'code-sample',
      'tooltip' => 'Insert/edit code sample',
      'plugin' => 'codesample',
      'required_tags' => array('pre', 'code'),
    ),
    'emoticons' => array(
      'icon' => 'emoji',
      'tooltip' => 'Emojis',
      'plugin' => 'emoticons',
    ),
    'fullscreen' => array (
      'icon' => 'fullscreen',
      'tooltip' => 'Fullscreen',
      'plugin' => 'fullscreen',
    ),
    'help' => array(
      'icon' => 'help',
      'tooltip' => 'Help',
      'plugin' => 'help',
    ),
    'insertdatetime' => array(
      'icon' => 'insert-time',
      'tooltip' => 'Insert date/time',
      'plugin' => 'insertdatetime',
    ),
    'searchreplace' => array(
      'icon' => 'search',
      'tooltip' => 'Find and replace',
      'plugin' => 'searchreplace',
    ),
    'table' => array(
      'icon' => 'table',
      'tooltip' => 'Table',
      'plugin' => 'table',
      'required_tags' => array('table', 'tr', 'th', 'td', 'caption'),
    ),
    'visualblocks' => array(
      'icon' => 'visualblocks',
      'tooltip' => 'Show blocks',
      'plugin' => 'visualblocks',
    ),
    'visualchars' => array(
      'icon' => 'visualchars',
      'tooltip' => 'Show invisible characters',
      'plugin' => 'visualchars',
    ),
    'wordcount' => array(
      'icon' => 'character-count',
      'tooltip' => 'Word count',
      'plugin' => 'wordcount',
    ),
    // Buttons provided by TinyMCE core.
    'alignleft' => array(
      'icon' => 'align-left',
      'tooltip' => 'Align left',
    ),
    'aligncenter' => array(
      'icon' => 'align-center',
      'tooltip' => 'Align center',
    ),
    'alignright' => array(
      'icon' => 'align-right',
      'tooltip' => 'Align right',
    ),
    'alignjustify' => array(
      'icon' => 'align-justify',
      'tooltip' => 'Justify',
    ),
    'alignnone' => array(
      'icon' => 'align-none',
      'tooltip' => 'No alignment',
    ),
    'bold' => array(
      'icon' => 'bold',
      'tooltip' => 'Bold',
      'required_tags' => array('strong'),
    ),
    'italic' => array(
      'icon' => 'italic',
      'tooltip' => 'Italic',
      'required_tags' => array('em'),
    ),
    'underline' => array(
      'icon' => 'underline',
      'tooltip' => 'Underline',
      'required_tags' => array('u'),
    ),
    'strikethrough' => array(
      'icon' => 'strike-through',
      'tooltip' => 'Strikethrough',
      'required_tags' => array('s'),
    ),
    'subscript' => array(
      'icon' => 'subscript',
      'tooltip' => 'Subscript',
      'required_tags' => array('sub'),
    ),
    'superscript' => array(
      'icon' => 'superscript',
      'tooltip' => 'Superscript',
      'required_tags' => array('sup'),
    ),
    'copy' => array(
      'icon' => 'copy',
      'tooltip' => 'Copy',
    ),
    'selectall' => array(
      'icon' => 'select-all',
      'tooltip' => 'Select all',
    ),
    'print' => array(
      'icon' => 'print',
      'tooltip' => 'Print',
    ),
    'cut' => array(
      'icon' => 'cut',
      'tooltip' => 'Cut',
    ),
    'paste' => array(
      'icon' => 'paste',
      'tooltip' => 'Paste',
    ),
    'removeformat' => array(
      'icon' => 'remove-formatting',
      'tooltip' => 'Clear formatting',
    ),
    'remove' => array(
      'icon' => 'remove',
      'tooltip' => 'Remove',
    ),
    'hr' => array(
      'icon' => 'horizontal-rule',
      'tooltip' => 'Horizontal line',
      'required_tags' => array('hr'),
    ),
    'blockquote' => array(
      'icon' => 'quote',
      'tooltip' => 'Blockquote',
      'required_tags' => array('blockquote', 'cite'),
    ),
    'undo' => array(
      'icon' => 'undo',
      'tooltip' => 'Undo',
    ),
    'redo' => array(
      'icon' => 'redo',
      'tooltip' => 'Redo',
    ),
    'visualaid' => array(
      'text' => 'Visual aids',
      'tooltip' => 'Visual aids',
    ),
    'outdent' => array(
      'icon' => 'outdent',// @todo get rid of inline style, if possible.
      'tooltip' => 'Decrease indent',
    ),
    'indent' => array(
      'icon' => 'indent',// @todo same as above.
      'tooltip' => 'Increase indent',
    ),
    'pastetext' => array(
      'icon' => 'paste-text',
      'tooltip' => 'Paste as text',
    ),
    // This is actually a nested menu item, not a button.
    'styles' => array(
      'text' => 'Styles&nbsp;▾',
      'tooltip' => 'Styles dropdown',
      'required_tags' => array(
        'h2', 'h3', 'h4', 'h5',
        'strong', 'em', 'u', 's', 'code',
        'p', 'blockquote', 'div', 'pre',
      ),
    ),
  );

  // Collect buttons from plugins defined via hook_tinymce_external_plugins().
  global $user;
  $formats = filter_formats($user);
  $dummy_format = reset($formats);
  $external_plugins = module_invoke_all('tinymce_external_plugins', $dummy_format);

  foreach ($external_plugins as $plugin_name => $data) {
    $plugin_buttons = $data['buttons'];
    foreach ($plugin_buttons as $button_name => $button_data) {
      $button_data['plugin'] = $plugin_name;
      $buttons[$button_name] = $button_data;
    }
  }

  return $buttons;
}
