export async function GET(){return Response.json({outscraperConfigured:Boolean(process.env.OUTSCRAPER_API_KEY)})}
