/**
 * api/scripts/mcp-server.ts
 * 
 * Bu sunucu, Cursor AI'ın projenin güncel veritabanı şemasına ve mimari kurallarına
 * doğrudan erişmesini sağlar. Context kaybını önlemek için kullanılır.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from 'fs';
import * as path from 'path';

// Sunucu Tanımlaması
const server = new Server(
  {
    name: "read-water-context-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper: Dosya Okuma
function readFileContent(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) {
      return `Error: File not found at ${filePath}`;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// TOOL LİSTESİ: Cursor'a hangi yeteneklere sahip olduğumuzu söylüyoruz
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_prisma_schema",
        description: "Reads the actual 'schema.prisma' file. Use this whenever you need to verify database models, relations (Asset/Device split), or field names. Source of Truth for DB.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_architecture_rules",
        description: "Reads the '.cursorrules' file from the project root. Use this to verify high-level architectural decisions, business logic, and UI specifications.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      }
    ],
  };
});

// TOOL ÇALIŞTIRMA: Cursor bir tool çağırdığında burası çalışır
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Çalışma dizini (process.cwd) muhtemelen 'api' klasörü olacaktır.
  // Ancak garanti olması için __dirname veya relative path kullanabiliriz.
  // Varsayım: Bu script 'api/scripts/' içinde, schema 'api/prisma/' içinde.
  
  const apiRoot = path.resolve(__dirname, '..'); // api klasörü
  const projectRoot = path.resolve(apiRoot, '..'); // proje kök dizini (read-water)

  if (request.params.name === "get_prisma_schema") {
    const schemaPath = path.join(apiRoot, 'prisma', 'schema.prisma');
    const content = readFileContent(schemaPath);
    
    return {
      content: [{ type: "text", text: content }],
    };
  }

  if (request.params.name === "get_architecture_rules") {
    const rulesPath = path.join(projectRoot, '.cursorrules');
    const content = readFileContent(rulesPath);

    return {
      content: [{ type: "text", text: content }],
    };
  }

  throw new Error("Tool not found");
});

// Sunucuyu Başlat
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Read Water MCP Server running on stdio"); // stderr logları cursor'ı bozmaz
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
