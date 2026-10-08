import mongoose from 'mongoose';

const aiAgentChatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender', required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  totalQueries: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('AiAgentChatSession', aiAgentChatSessionSchema);
