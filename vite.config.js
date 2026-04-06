import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { buildAuthScaffoldResponse } from "./src/components/auth-backend-scaffold.js"

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []

    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8")
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on("error", reject)
  })
}

function writeJson(res, status, data) {
  res.statusCode = status
  res.setHeader("content-type", "application/json")
  res.end(JSON.stringify(data))
}

function havenlyAuthScaffoldPlugin() {
  const handler = async (req, res, next) => {
    if (req.method !== "POST" || req.url !== "/api/auth/login") {
      next()
      return
    }

    try {
      const request = await readRequestBody(req)
      const response = buildAuthScaffoldResponse(request)
      writeJson(res, response.status, response.data)
    } catch {
      writeJson(res, 400, { message: "Invalid auth scaffold request" })
    }
  }

  return {
    name: "havenly-auth-scaffold",
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), havenlyAuthScaffoldPlugin()],
  base: "/github-pages-react-hello/"
})
