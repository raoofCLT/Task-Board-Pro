import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority'
      },
      default: 'medium'
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'review', 'done'],
        message: '{VALUE} is not a valid status'
      },
      default: 'todo'
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      required: [true, 'Sprint ID is required'],
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true
    },
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    comments: [commentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastAssignedUserSnapshot: {
      userId: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String },
      email: { type: String }
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
