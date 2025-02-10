"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueService = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
class MessageQueueService {
    url;
    connection = null;
    channel = null;
    constructor(url) {
        this.url = url;
    }
    async connect() {
        try {
            this.connection = await amqplib_1.default.connect(this.url);
            this.channel = await this.connection.createChannel();
        }
        catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }
    async close() {
        try {
            await this.channel?.close();
            await this.connection?.close();
        }
        catch (error) {
            console.error('Error closing connection:', error);
            throw error;
        }
    }
    getChannel() {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }
        return this.channel;
    }
}
exports.MessageQueueService = MessageQueueService;
