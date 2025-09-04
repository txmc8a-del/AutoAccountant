import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  access_token: {
    type: String,
    required: true,
    unique: true
  },
  item_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  institution_id: {
    type: String,
    required: false
  },
  institution_name: {
    type: String,
    required: false
  },
  accounts: [{
    account_id: String,
    name: String,
    type: String,
    subtype: String,
    mask: String
  }],
  status: {
    type: String,
    enum: ['active', 'pending', 'error'],
    default: 'active'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for efficient queries
itemSchema.index({ user_id: 1, status: 1 });
itemSchema.index({ access_token: 1 });
itemSchema.index({ item_id: 1 });

const Item = mongoose.model('Item', itemSchema);

export default Item;
