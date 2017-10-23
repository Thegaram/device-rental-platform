const ssh = require('ssh2-client');

async function shell(data, password) {
  const options = {
    host: data.host,
    port: data.port,
    username: data.username,
    password,
    // askPassword: true,
    // debug: console.log,
  };

  await ssh.shell('', options);
}

module.exports = {
  shell
};
