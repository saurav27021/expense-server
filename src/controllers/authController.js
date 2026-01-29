const users = require('../dao/userDb');

const authController = {
  login: (request, response) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: 'Email and Password are required'
      });
    }

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      return response.status(200).json({
        message: 'User authenticated',
        user: user
      });
    } else {
      return response.status(400).json({
        message: 'Invalid email or password'
      });
    }
  },

  register: (request, response) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: 'Name, Email, Password are required'
      });
    }


    const user = users.find(u => u.email === email);
    if (user) {
      return response.status(400).json({
        message: `User already exist with email: ${email}`
      });
    }

    const newUser = {
      id: users.length + 1,
      name: name,
      email: email,
      password: password
    };

    users.push(newUser);

    return response.status(200).json({
      message: 'User registered',
      user: { id: newUser.id }
    });
  },
};

module.exports = authController;