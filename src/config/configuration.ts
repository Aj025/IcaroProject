import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  supabase: {
    url: process.env.SUPABASE_URL,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  n8n: {
    webhookSecret: process.env.N8N_WEBHOOK_SECRET,
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
  },
  email: {
    apiKey: process.env.TRANSACTIONAL_EMAIL_API_KEY,
  },
}));
