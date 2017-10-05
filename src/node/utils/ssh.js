const ssh = require('ssh2-client');

module.exports = {
  shell: async (opts) => await ssh.shell('', opts)
}
