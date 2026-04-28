import Docker from 'dockerode';

const dockerProxyHost = process.env.DOCKER_PROXY_HOST || 'docker-proxy';
const dockerProxyPort = Number(process.env.DOCKER_PROXY_PORT || 2375);

export const docker = new Docker({
  host: dockerProxyHost,
  port: dockerProxyPort,
  protocol: 'http'
});