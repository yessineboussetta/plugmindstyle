<?php
/*
Plugin Name: PlugMind Chatbot
Description: Embed an AI chatbot on your website.
Version: 1.0
Author: PlugMind
*/

function plugmind_chatbot_shortcode($atts) {
    $atts = shortcode_atts([
        'id' => '',
    ], $atts);

    return "<div data-chatbot-id='{$atts['id']}'></div>
<script src='" . plugin_dir_url(__FILE__) . "plugmind-chat.js'></script>
<link rel='stylesheet' href='" . plugin_dir_url(__FILE__) . "plugmind-style.css'>";
}
add_shortcode('chatbot', 'plugmind_chatbot_shortcode');
