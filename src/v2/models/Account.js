import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  account_id: {
    type: String,
    required: true,
    unique: true
  },
  item_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  official_name: {
    type: String,
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['depository', 'credit', 'loan', 'investment', 'other']
  },
  subtype: {
    type: String,
    required: true
  },
  mask: {
    type: String,
    required: false
  },
  institution_name: {
    type: String,
    required: false
  },
  balances: {
    available: {
      type: Number,
      default: null
    },
    current: {
      type: Number,
      default: null
    },
    limit: {
      type: Number,
      default: null
    },
    iso_currency_code: {
      type: String,
      default: 'USD'
    },
    unofficial_currency_code: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'error'],
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

// Indexes for efficient queries
accountSchema.index({ user_id: 1, status: 1 });
accountSchema.index({ item_id: 1, status: 1 });
accountSchema.index({ account_id: 1 });
accountSchema.index({ type: 1, subtype: 1 });

const Account = mongoose.model('Account', accountSchema);

export default Account;
