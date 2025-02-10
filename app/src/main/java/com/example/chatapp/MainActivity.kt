package com.example.chatapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.chatapp.adapter.MessageAdapter
import com.example.chatapp.databinding.ActivityMainBinding
import com.example.chatapp.model.Message
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var adapter: MessageAdapter
    private val assistantAvatar = "https://example.com/assistant-avatar.jpg" // Replace with actual avatar URL

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupMessageInput()
        showInitialMessage()
    }

    private fun setupRecyclerView() {
        adapter = MessageAdapter()
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity).apply {
                stackFromEnd = true
            }
            adapter = this@MainActivity.adapter
        }
    }

    private fun showInitialMessage() {
        val timestamp = SimpleDateFormat(
            "EEE MMM dd yyyy HH:mm:ss 'GMT'Z (zzzz)",
            Locale.ENGLISH
        ).format(Date())

        adapter.addMessage(
            Message(
                content = "您好！我是您的私人助理，请问有什么可以帮您？",
                timestamp = timestamp,
                avatarUrl = assistantAvatar,
                isAssistant = true
            )
        )
    }

    private fun setupMessageInput() {
        binding.messageInput.hint = "输入消息..."
        
        binding.sendButton.setOnClickListener {
            val messageText = binding.messageInput.text.toString().trim()
            if (messageText.isNotEmpty()) {
                val timestamp = SimpleDateFormat(
                    "EEE MMM dd yyyy HH:mm:ss 'GMT'Z (zzzz)",
                    Locale.ENGLISH
                ).format(Date())
                
                adapter.addMessage(
                    Message(
                        content = messageText,
                        timestamp = timestamp
                    )
                )
                
                // Simulate assistant response
                simulateAssistantResponse()
                
                binding.messageInput.text?.clear()
                binding.recyclerView.smoothScrollToPosition(adapter.itemCount - 1)
            }
        }
    }

    private fun simulateAssistantResponse() {
        val timestamp = SimpleDateFormat(
            "EEE MMM dd yyyy HH:mm:ss 'GMT'Z (zzzz)",
            Locale.ENGLISH
        ).format(Date())

        // Delayed response to simulate processing
        binding.root.postDelayed({
            adapter.addMessage(
                Message(
                    content = "收到您的消息，我会尽快处理。",
                    timestamp = timestamp,
                    avatarUrl = assistantAvatar,
                    isAssistant = true
                )
            )
            binding.recyclerView.smoothScrollToPosition(adapter.itemCount - 1)
        }, 1000)
    }
}
