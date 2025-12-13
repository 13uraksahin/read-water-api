"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const server = new index_js_1.Server({
    name: "read-water-context-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
function readFileContent(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return `Error: File not found at ${filePath}`;
        }
        return fs.readFileSync(filePath, 'utf-8');
    }
    catch (error) {
        return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
    }
}
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const apiRoot = path.resolve(__dirname, '..');
    const projectRoot = path.resolve(apiRoot, '..');
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
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Read Water MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in MCP server:", error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map