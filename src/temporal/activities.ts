export async function logMessage(name: string): Promise<string> {
  const message = `Hello, ${name}! logMessage activity ran at ${new Date().toISOString()}`;
  console.log(`[temporal activity] ${message}`);
  return message;
}
