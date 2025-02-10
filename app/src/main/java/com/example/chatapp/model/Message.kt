package com.example.chatapp.model

data class Message(
    val content: String,
    val timestamp: String,
    val avatarUrl: String? = null,
    val isAssistant: Boolean = false
)
