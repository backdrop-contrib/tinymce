<?php
/**
 * @file
 * Menu callbacks for TinyMCE module.
 */

/**
 * Menu callback; Saves images uploaded via copy/paste into the editor.
 *
 * @param stdClass $format
 *   Filter format.
 *
 * @return array|void
 */
function tinymce_image_upload($format) {
  $upload_settings = $format->editor_settings['image_upload'];
  if (!$upload_settings['status']) {
    backdrop_add_http_header('Status', '403 Forbidden');
    return;
  }

  // Odd structure needed for file_save_upload().
  if (isset($_FILES['file'])) {
    $_FILES['files'] = array();
    foreach ($_FILES['file'] as $key => $value) {
      $_FILES['files'][$key]['upload'] = $value;
    }
  }

  $destination = $upload_settings['scheme'] . '://' .  $upload_settings['directory'];
  $validators = array(
    'file_validate_is_image' => array(),
  );
  if ($upload_settings['max_size']) {
    $validators['file_validate_size'] = array(parse_size($upload_settings['max_size']));
  }
  if ($upload_settings['max_dimensions']['width']) {
    $validators['file_validate_image_resolution'] = array(
      $upload_settings['max_dimensions']['width'] . 'x' . $upload_settings['max_dimensions']['height'],
    );
  }

  file_prepare_directory($destination, FILE_CREATE_DIRECTORY);
  $file = file_save_upload('upload', $validators, $destination);
  if ($file) {
    // Try to make a local path if possible for better portability.
    $absolute_path = parse_url($GLOBALS['base_url'], PHP_URL_PATH) . '/';
    $url = file_create_url($file->uri);
    $url = str_replace($GLOBALS['base_url'] . '/', $absolute_path, $url);
    $image_info = image_get_info($file->uri);
    $response = array(
      'uploaded' => 1,
      'location' => $url,
      'fileId' => $file->fid,
      'width' => $image_info['width'],
      'height' => $image_info['height'],
    );
  }
  else {
    $response = array('uploaded' => 0);
  }

  // file_save_upload() sets messages via backdrop_set_message(). Pull the
  // responses out and display via TinyMCE's notification system.
  $messages = backdrop_get_messages();
  $message_string = '';
  foreach ($messages as $type) {
    $message_string .= $type[0] . ' ';
  }
  if ($message_string) {
    $response['errors'] = strip_tags($message_string);
  }

  return $response;
}
