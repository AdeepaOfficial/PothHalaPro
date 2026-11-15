package server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

public class PothHalaServer {
    private static final int PORT = 8080;
    private static final String KEY_SALT = "POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET";
    private static Path publicDir;

    public static void main(String[] args) throws IOException {
        // Resolve public directory relative to working dir or project root
        Path base = Paths.get(".").toAbsolutePath().normalize();
        if (Files.exists(base.resolve("public"))) {
            publicDir = base.resolve("public");
        } else if (Files.exists(base.resolve("PothHalaPro/public"))) {
            publicDir = base.resolve("PothHalaPro/public");
        } else {
            publicDir = base;
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/license/verify", new LicenseVerifyHandler());
        server.createContext("/api/license/generate", new LicenseGenerateHandler());
        server.createContext("/", new StaticFileHandler());
        server.setExecutor(null);

        System.out.println("===============================================================");
        System.out.println(" PothHalaPro - All-in-One Bookshop & Education Print Studio");
        System.out.println(" Exact 1:1 Scale Print & Offline License System");
        System.out.println("===============================================================");
        System.out.println(" Server running at: http://localhost:" + PORT);
        System.out.println(" Static Web Assets: " + publicDir.toAbsolutePath());
        System.out.println(" Status API:        http://localhost:" + PORT + "/api/status");
        System.out.println("===============================================================");

        server.start();
    }

    // Static File Serving Handler
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String uriPath = exchange.getRequestURI().getPath();
            if (uriPath.equals("/") || uriPath.isEmpty()) {
                uriPath = "/index.html";
            }

            // Decode URL
            String decoded = URLDecoder.decode(uriPath, StandardCharsets.UTF_8);
            Path filePath = publicDir.resolve(decoded.startsWith("/") ? decoded.substring(1) : decoded).normalize();

            // Prevent directory traversal
            if (!filePath.startsWith(publicDir) || !Files.exists(filePath) || Files.isDirectory(filePath)) {
                filePath = publicDir.resolve("index.html");
            }

            if (!Files.exists(filePath)) {
                String notFound = "404 Not Found - PothHalaPro";
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes(StandardCharsets.UTF_8));
                }
                return;
            }

            String mimeType = getMimeType(filePath.toString());
            byte[] bytes = Files.readAllBytes(filePath);

            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // Status API Handler
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String json = String.format(
                "{\"status\":\"running\",\"name\":\"PothHalaPro Print Studio\",\"version\":\"1.0.0\",\"jvm\":\"%s\",\"port\":%d,\"timestamp\":\"%s\"}",
                System.getProperty("java.version"),
                PORT,
                Instant.now().toString()
            );
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // License Verification Handler
    static class LicenseVerifyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String code = "";
            if (query != null && query.contains("code=")) {
                code = query.split("code=")[1].split("&")[0];
            }

            boolean valid = verifyKey(code);
            String json = String.format("{\"valid\":%b,\"code\":\"%s\",\"tier\":\"LIFETIME_PRO\"}", valid, code);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // License Generation Handler
    static class LicenseGenerateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String newKey = generateKey("2027");
            String json = String.format("{\"generated\":true,\"code\":\"%s\",\"tier\":\"LIFETIME_PRO\"}", newKey);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // Key calculation & validation
    private static String computeHash(String str) {
        int hash = 0;
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            hash = ((hash << 5) - hash) + c;
        }
        return Integer.toString(Math.abs(hash), 36).toUpperCase();
    }

    private static boolean verifyKey(String code) {
        if (code == null) return false;
        String clean = code.trim().toUpperCase();
        String[] parts = clean.split("-");
        if (parts.length != 5 || !parts[0].equals("PHP")) return false;

        String year = parts[1];
        String p1 = parts[2];
        String p2 = parts[3];
        String p3 = parts[4];

        String checkRaw = year + "-" + p1 + "-" + p2 + "-" + KEY_SALT;
        String expected = computeHash(checkRaw);
        if (expected.length() > 4) expected = expected.substring(0, 4);

        return p3.startsWith(expected) || expected.startsWith(p3);
    }

    private static String generateKey(String year) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random rnd = new Random();
        StringBuilder p1 = new StringBuilder();
        StringBuilder p2 = new StringBuilder();
        for (int i = 0; i < 4; i++) {
            p1.append(chars.charAt(rnd.nextInt(chars.length())));
            p2.append(chars.charAt(rnd.nextInt(chars.length())));
        }

        String checkRaw = year + "-" + p1 + "-" + p2 + "-" + KEY_SALT;
        String p3 = computeHash(checkRaw);
        if (p3.length() < 4) p3 = (p3 + "XXXX").substring(0, 4);
        else p3 = p3.substring(0, 4);

        return "PHP-" + year + "-" + p1 + "-" + p2 + "-" + p3;
    }

    private static String getMimeType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }
}
