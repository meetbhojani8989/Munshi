// standalone output is used by the Tauri desktop build; mongodb-memory-server is only for local runs without MONGODB_URI.
module.exports={output:process.env.MUNSHI_DESKTOP?'standalone':undefined,serverExternalPackages:['tesseract.js','mongodb-memory-server']};
