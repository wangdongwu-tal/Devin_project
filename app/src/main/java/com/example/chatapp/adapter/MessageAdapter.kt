package com.example.chatapp.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.chatapp.databinding.ItemMessageBinding
import com.example.chatapp.model.Message
import com.bumptech.glide.Glide

class MessageAdapter : RecyclerView.Adapter<MessageAdapter.MessageViewHolder>() {
    private val messages = mutableListOf<Message>()

    fun addMessage(message: Message) {
        messages.add(message)
        notifyItemInserted(messages.size - 1)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val binding = ItemMessageBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return MessageViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        holder.bind(messages[position])
    }

    override fun getItemCount() = messages.size

    class MessageViewHolder(private val binding: ItemMessageBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(message: Message) {
            binding.messageTextView.text = message.content
            binding.timestampTextView.text = message.timestamp
            
            if (message.isAssistant) {
                binding.avatarImageView.setImageResource(R.drawable.ic_assistant_avatar)
            } else {
                binding.avatarImageView.setImageResource(R.drawable.ic_user_avatar)
            }
            
            message.avatarUrl?.let { url ->
                Glide.with(binding.root.context)
                    .load(url)
                    .error(if (message.isAssistant) R.drawable.ic_assistant_avatar else R.drawable.ic_user_avatar)
                    .into(binding.avatarImageView)
            }
        }
    }
}
