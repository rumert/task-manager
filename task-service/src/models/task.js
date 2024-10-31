const mongoose = require('../utils/db');
const { Schema, model } = mongoose;

const taskSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    workerId: {
        type: String,
        default: '',
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        default: 'pending',
        index: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    retryCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

taskSchema.index({ workerId: 1 });
taskSchema.index({ status: 1 });

module.exports = model('Task', taskSchema);
