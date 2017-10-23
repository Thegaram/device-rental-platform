const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const Utils = require('./utils.js');


function initializeContainer(container, username, password) {
  var options = {
    Cmd: ['/bin/bash', '-c', `useradd ${username}; mkdir /home/${username}; chown ${username}.${username} /home/${username}; echo ${username}:${password} | chpasswd`],
    AttachStdout: true,
    AttachStderr: true
  };

  return new Promise((resolve, reject) => {
    container.exec(options, function(err, exec) {
      if (err)
        reject(err);

      exec.start(function(err, stream) {
        if (err)
          reject(err);

        container.modem.demuxStream(stream, process.stdout, process.stderr);

        exec.inspect(function(err, data) {
          if (err)
            reject(err);
          resolve(data);
        });
      });
    });
  });
}

class SSHContainer {
  constructor(container_name, ssh_port) {
    this.container = null;
    this.container_name = container_name;
    this.ssh_port = ssh_port;
  }

  async start_access(requestId, password) {
    this.container = await docker.createContainer({
      Image: this.container_name,
      PortBindings: { '22/tcp': [{ 'HostPort': this.ssh_port }] }
    });

    this.container = await this.container.start();

    await initializeContainer(this.container, requestId, password);

    // make sure ssh server is set up...
    await Utils.sleep(200);
  }

  async stop_access(requestId) {
    await this.container.stop();
  }
}

module.exports = SSHContainer;
