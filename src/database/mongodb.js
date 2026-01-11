const mongoose = require('mongoose');
const colors = require('colors');
require('dotenv').config({ quiet: true });

// Warning Schema
const warningSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  warnings: [
    {
      reason: String,
      moderator: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

// Create index for faster queries
warningSchema.index({ userId: 1, guildId: 1 });

const Warning = mongoose.model('Warning', warningSchema);

// Connect to MongoDB
async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log(colors.yellow('WARNING: MONGODB_URI not found in .env'));
      return false;
    }

    // Ensure database name is VoxHelper
    let mongoUri = process.env.MONGODB_URI;
    
    // Add /VoxHelper if not already present
    if (!mongoUri.includes('/VoxHelper')) {
      // Remove trailing slash if exists
      mongoUri = mongoUri.replace(/\/$/, '');
      mongoUri += '/VoxHelper';
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(colors.green('✓ Connected to MongoDB (VoxHelper)'));
    return true;
  } catch (error) {
    console.log(colors.red(`✗ Failed to connect to MongoDB: ${error.message}`));
    return false;
  }
}

module.exports = {
  connectDB,
  Warning
};
