module.exports = {
  reactStrictMode: true,
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    ASANA_ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN,
    GOOGLE_DRIVE_API_KEY: process.env.GOOGLE_DRIVE_API_KEY,
    QBO_CLIENT_ID: process.env.QBO_CLIENT_ID,
    QBO_CLIENT_SECRET: process.env.QBO_CLIENT_SECRET,
  },
};