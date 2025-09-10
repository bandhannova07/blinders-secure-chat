const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Permanent President Account Configuration
const PRESIDENT_CONFIG = {
  username: 'president-LordBandhan',
  password: 'Blinder\'sPresidentLBD07',
  role: 'president',
  status: 'approved'
};

/**
 * Ensures the permanent President account exists in the database
 * This function runs on server startup to guarantee the account is always available
 */
async function ensurePresidentAccount() {
  try {
    console.log('🔍 Checking for permanent President account...');
    
    // Check if the President account exists
    let president = await User.findOne({ 
      username: PRESIDENT_CONFIG.username,
      role: 'president' 
    });

    if (!president) {
      console.log('👑 Creating permanent President account...');
      
      // Hash the password securely
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(PRESIDENT_CONFIG.password, saltRounds);
      
      // Create the permanent President account
      president = new User({
        username: PRESIDENT_CONFIG.username,
        password: hashedPassword,
        originalPassword: PRESIDENT_CONFIG.password, // Store for reference (encrypted in DB)
        role: PRESIDENT_CONFIG.role,
        status: PRESIDENT_CONFIG.status,
        isPermanent: true, // Mark as permanent account
        createdAt: new Date(),
        lastLogin: null
      });

      await president.save();
      console.log('✅ Permanent President account created successfully');
    } else {
      console.log('✅ Permanent President account already exists');
      
      // Ensure the account has correct properties
      if (!president.isPermanent) {
        president.isPermanent = true;
        await president.save();
        console.log('🔧 Updated President account with permanent flag');
      }
    }

    return president;
  } catch (error) {
    console.error('❌ Error ensuring President account:', error);
    throw error;
  }
}

/**
 * Validates if a user is the permanent President
 */
function isPermanentPresident(user) {
  return user && 
         user.username === PRESIDENT_CONFIG.username && 
         user.role === 'president' && 
         user.isPermanent === true;
}

/**
 * Prevents modification of the permanent President account
 */
function validatePresidentProtection(userId, user) {
  if (user && user.isPermanent && user.role === 'president') {
    throw new Error('The permanent President account cannot be modified or deleted');
  }
}

/**
 * Ensures no other account can be assigned President role
 */
function validatePresidentRoleAssignment(username, role) {
  if (role === 'president' && username !== PRESIDENT_CONFIG.username) {
    throw new Error('Only the permanent President account can have the President role');
  }
}

module.exports = {
  ensurePresidentAccount,
  isPermanentPresident,
  validatePresidentProtection,
  validatePresidentRoleAssignment,
  PRESIDENT_CONFIG
};
