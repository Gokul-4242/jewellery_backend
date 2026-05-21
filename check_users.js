const mongoose = require('mongoose');
require('dotenv').config();

const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  name: String
}));

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).limit(5);
    console.log('Existing users:', JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
