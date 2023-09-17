<?php
/**
 * @file
 * Admin form handling for TinyMCE module.
 */

/**
 * Custom callback for filter form.
 */
function _tinymce_settings_form(&$form, $form_state, $format) {
  $form['#validate'][] = '_tinymce_settings_form_validate';
  $elements = array();
  $settings = $format->editor_settings;

  $elements['tabs'] = array(
    '#type' => 'vertical_tabs',
  );
  $elements['tabs']['tinymce_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Editor settings'),
    '#parents' => array('editor_settings', 'tinymce_settings'),
  );
  $elements['tabs']['tinymce_settings']['profile'] = array(
    '#title' => t('Editor profile'),
    '#type' => 'select',
    '#options' => _tinymce_get_profile_options(),
    '#default_value' => $settings['tinymce_settings']['profile'],
  );
  $elements['tabs']['tinymce_settings']['skin'] = array(
    '#title' => t('Editor skin'),
    '#type' => 'select',
    '#options' => array(
      'oxide' => t('Light'),
      'oxide-dark' => t('Dark'),
    ),
    '#default_value' => $settings['tinymce_settings']['skin'],
  );
  $elements['tabs']['tinymce_settings']['content_css'] = array(
    '#title' => t('Content CSS files'),
    '#type' => 'textarea',
    '#default_value' => $settings['tinymce_settings']['content_css'],
    '#rows' => 3,
    '#attributes' => array(
      'placeholder' => '/core/themes/basis/css/skin.css',
    ),
    '#description' => t('Add URLs to CSS files, the editor should use to display its content, one file per line.'),
  );

  $elements['tabs']['image_browser'] = array(
    '#type' => 'fieldset',
    '#title' => t('Image browser'),
    '#parents' => array('editor_settings', 'image_browser'),
  );
  $elements['tabs']['image_browser']['enable'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable image browser'),
    '#default_value' => $settings['image_browser']['enable'],
  );

  $elements['tabs']['image_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('Image upload'),
  );
  $elements['tabs']['image_settings']['image'] = filter_editor_image_upload_settings_form($format);
  $elements['tabs']['image_settings']['image']['#parents'] = array(
    'editor_settings',
    'image_upload',
  );
  $elements['tabs']['file_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('File upload'),
  );
  $elements['tabs']['file_settings']['file'] = filter_editor_file_upload_settings_form($format);
  $elements['tabs']['file_settings']['file']['#parents'] = array(
    'editor_settings',
    'file_upload',
  );

  return $elements;
}

/**
 * Validation callback for settings form.
 */
function _tinymce_settings_form_validate($form, &$form_state) {
  unset($form_state['values']['editor_settings']['tabs']);

  if (!empty($form_state['values']['editor_settings']['tinymce_settings']['content_css'])) {
    $content_css = trim($form_state['values']['editor_settings']['tinymce_settings']['content_css']);
    $files = explode("\n", $content_css);
    $files_trimmed = array();
    foreach ($files as $file) {
      $file = trim($file);
      if (!preg_match('/.+\.css$/', $file)) {
        form_set_error('editor_settings][tinymce_settings][content_css', t('At least one URL to content CSS does not end with ".css".'));
      }
      if (!valid_url($file, TRUE) && !valid_url($file, FALSE)) {
        form_set_error('editor_settings][tinymce_settings][content_css', t('At least one URL to content CSS is invalid.'));
      }
      $files_trimmed[] = $file;
    }
    $form_state['values']['editor_settings']['tinymce_settings']['content_css'] = implode("\n", $files_trimmed);
  }
}

/**
 * Custom callback to return options list for admin form.
 *
 * @return array
 */
function _tinymce_get_profile_options() {
  $options = array();
  $all_profiles = config_get_names_with_prefix('tinymce.profile');
  foreach ($all_profiles as $config_name) {
    $config = config($config_name);
    $profile_name = $config->get('name');
    $options[$profile_name] = $config->get('label');
  }
  return $options;
}
