module.exports = {
  apps: [
    {
      name: 'app-despesas-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/html/app-despesas/apps/api',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/www/html/app-despesas/logs/api-error.log',
      out_file: '/var/www/html/app-despesas/logs/api-out.log',
      time: true
    },
    {
      name: 'app-despesas-web',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/html/app-despesas/apps/web',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/www/html/app-despesas/logs/web-error.log',
      out_file: '/var/www/html/app-despesas/logs/web-out.log',
      time: true
    }
  ]
};