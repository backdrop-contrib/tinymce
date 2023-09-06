<?php
/**
 * @file
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
  $elements['tabs']['file_settings'] = array(
    '#type' => 'fieldset',
    '#title' => t('File upload'),
  );
  $elements['tabs']['image_settings']['image'] = filter_editor_image_upload_settings_form($format);
  $elements['tabs']['image_settings']['image']['#parents'] = array('editor_settings', 'image_upload');
  $elements['tabs']['file_settings']['file'] = filter_editor_file_upload_settings_form($format);
  $elements['tabs']['file_settings']['file']['#parents'] = array('editor_settings', 'file_upload');

  return $elements;
}

/**
 * Validation callback for settings form.
 */
function _tinymce_settings_form_validate($form, &$form_state) {
  // @todo why is type vertical_tabs part of form submission?
  unset($form_state['values']['editor_settings']['tabs']);
}
