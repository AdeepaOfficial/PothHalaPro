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
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * PothHalaPro - All-in-One Bookshop, Communication & Education Print Studio
 * High-performance, zero-dependency Java 21 HTTP & REST Backend Server.
 * Supports offline licensing, POS fast billing, JSON persistence, and static PWA assets.
 */
public class PothHalaServer {
    private static final int PORT = 8080;
    private static final String KEY_SALT = "POTHA_HALA_PRO_LKR_2026_OFFLINE_SECRET";
    private static final String TOKEN_SECRET = "POTH_HALA_TOKEN_SIG_2026_LKR_OFFLINE";
    
    private static Path baseDir;
    private static Path publicDir;
    private static Path dataDir;
    private static Path licensesFile;
    private static Path receiptsFile;
    private static Path auditFile;

    private static final Object lock = new Object();
    private static final AtomicInteger receiptSeq = new AtomicInteger(1001);

    public static void main(String[] args) throws IOException {
        int port = PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        // Resolve directory paths
        baseDir = Paths.get(".").toAbsolutePath().normalize();
        if (Files.exists(baseDir.resolve("public"))) {
            publicDir = baseDir.resolve("public");
            dataDir = baseDir.resolve("data");
        } else if (Files.exists(baseDir.resolve("PothHalaPro/public"))) {
            baseDir = baseDir.resolve("PothHalaPro");
            publicDir = baseDir.resolve("public");
            dataDir = baseDir.resolve("data");
        } else {
            publicDir = baseDir;
            dataDir = baseDir.resolve("data");
        }

        // Initialize persistent data directory
        if (!Files.exists(dataDir)) {
            Files.createDirectories(dataDir);
        }
        licensesFile = dataDir.resolve("licenses.json");
        receiptsFile = dataDir.resolve("receipts.json");
        auditFile = dataDir.resolve("audit_log.json");

        initDataFiles();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        
        // API Routing
        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/license/verify", new LicenseVerifyHandler());
        server.createContext("/api/license/activate", new LicenseActivateHandler());
        server.createContext("/api/license/generate", new LicenseGenerateHandler());
        server.createContext("/api/license/audit", new LicenseAuditHandler());
        server.createContext("/api/billing/catalog", new BillingCatalogHandler());
        server.createContext("/api/billing/receipt", new BillingReceiptHandler());
        server.createContext("/api/billing/receipts", new BillingReceiptListHandler());
        server.createContext("/api/billing/daily-summary", new BillingDailySummaryHandler());
        server.createContext("/api/education/curriculum", new EducationCurriculumHandler());
        server.createContext("/api/education/forms", new EducationFormsHandler());
        
        // Static Asset Serving (Fallback for SPA / PWA)
        server.createContext("/", new StaticFileHandler());
        
        // Multi-threaded pool for concurrent POS & Print requests
        server.setExecutor(Executors.newFixedThreadPool(16));

        System.out.println("==================================================================");
        System.out.println(" 🇱🇰 PothHalaPro - All-in-One Bookshop & Education Print Studio");
        System.out.println(" Exact 1:1 Scale Print & Offline License System (Java Backend)");
        System.out.println("==================================================================");
        System.out.println(" Server running at:     http://localhost:" + port);
        System.out.println(" Web Client (PWA):      http://localhost:" + port + "/");
        System.out.println(" System Status API:     http://localhost:" + port + "/api/status");
        System.out.println(" POS Fast Billing API:  http://localhost:" + port + "/api/billing/catalog");
        System.out.println(" Offline Data Storage:  " + dataDir.toAbsolutePath());
        System.out.println(" Static Web Assets:     " + publicDir.toAbsolutePath());
        System.out.println("==================================================================");

        server.start();
    }

    private static void initDataFiles() throws IOException {
        synchronized (lock) {
            if (!Files.exists(licensesFile)) {
                String defaultLicenses = "[\n" +
                    "  {\n" +
                    "    \"code\": \"PHP-2027-PRO1-LKR2-K9Q2\",\n" +
                    "    \"shopName\": \"PothHala Central Bookshop\",\n" +
                    "    \"tier\": \"LIFETIME_PRO\",\n" +
                    "    \"maxDevices\": 2,\n" +
                    "    \"activatedDevices\": [],\n" +
                    "    \"createdAt\": \"" + Instant.now().toString() + "\"\n" +
                    "  }\n" +
                    "]";
                Files.writeString(licensesFile, defaultLicenses, StandardCharsets.UTF_8);
            }
            if (!Files.exists(receiptsFile)) {
                Files.writeString(receiptsFile, "[]", StandardCharsets.UTF_8);
            }
            if (!Files.exists(auditFile)) {
                Files.writeString(auditFile, "[]", StandardCharsets.UTF_8);
            }
        }
    }

    // =========================================================================
    // HTTP Handlers
    // =========================================================================

    // Static File Serving Handler
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String uriPath = exchange.getRequestURI().getPath();
            if (uriPath.equals("/") || uriPath.isEmpty()) {
                uriPath = "/index.html";
            }

            String decoded = URLDecoder.decode(uriPath, StandardCharsets.UTF_8);
            Path filePath = publicDir.resolve(decoded.startsWith("/") ? decoded.substring(1) : decoded).normalize();

            if (!filePath.startsWith(publicDir) || !Files.exists(filePath) || Files.isDirectory(filePath)) {
                filePath = publicDir.resolve("index.html");
            }

            if (!Files.exists(filePath)) {
                sendJsonResponse(exchange, 404, "{\"error\":\"File not found\",\"path\":\"" + escapeJson(uriPath) + "\"}");
                return;
            }

            String mimeType = getMimeType(filePath.toString());
            byte[] bytes = Files.readAllBytes(filePath);

            exchange.getResponseHeaders().set("Content-Type", mimeType);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Cache-Control", uriPath.endsWith(".html") ? "no-cache" : "public, max-age=86400");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // System Status API
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;
            
            long receiptCount = 0;
            try {
                String rc = Files.readString(receiptsFile, StandardCharsets.UTF_8);
                receiptCount = countOccurrences(rc, "\"receiptId\":");
            } catch (Exception ignored) {}

            String json = String.format(
                "{\"status\":\"running\",\"name\":\"PothHalaPro Print Studio\",\"version\":\"1.1.0\",\"engine\":\"Java 21 Virtual Server\",\"jvm\":\"%s\",\"port\":%d,\"timestamp\":\"%s\",\"receiptsCount\":%d,\"dataDir\":\"%s\"}",
                escapeJson(System.getProperty("java.version")),
                PORT,
                Instant.now().toString(),
                receiptCount,
                escapeJson(dataDir.toString())
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    // License Verification API (GET)
    static class LicenseVerifyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String query = exchange.getRequestURI().getQuery();
            String code = extractQueryParam(query, "code");
            String fingerprint = extractQueryParam(query, "fingerprint");

            boolean valid = verifyKey(code);
            String token = "";
            if (valid) {
                token = generateOfflineToken(code, fingerprint.isEmpty() ? "DEVICE_DEFAULT" : fingerprint);
            }

            String json = String.format(
                "{\"valid\":%b,\"code\":\"%s\",\"tier\":\"LIFETIME_PRO\",\"token\":\"%s\",\"timestamp\":\"%s\"}",
                valid, escapeJson(code), token, Instant.now().toString()
            );
            logAuditEvent("VERIFY", code, fingerprint, valid ? "SUCCESS" : "INVALID_KEY");
            sendJsonResponse(exchange, 200, json);
        }
    }

    // License Activation API (POST with device fingerprinting)
    static class LicenseActivateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed. Use POST.\"}");
                return;
            }

            String body = readRequestBody(exchange);
            String code = extractJsonField(body, "code");
            String fingerprint = extractJsonField(body, "fingerprint");
            String deviceName = extractJsonField(body, "deviceName");
            if (deviceName.isEmpty()) deviceName = "Counter PC";

            if (code.isEmpty() || !verifyKey(code)) {
                sendJsonResponse(exchange, 400, "{\"activated\":false,\"error\":\"Invalid activation key format or checksum.\"}");
                logAuditEvent("ACTIVATE", code, fingerprint, "FAILED_INVALID_KEY");
                return;
            }

            String token = generateOfflineToken(code, fingerprint);
            
            // Persist device activation
            synchronized (lock) {
                try {
                    String auditEntry = String.format(
                        "{\"timestamp\":\"%s\",\"action\":\"ACTIVATION\",\"code\":\"%s\",\"fingerprint\":\"%s\",\"deviceName\":\"%s\",\"status\":\"ACTIVATED\"},\n",
                        Instant.now().toString(), escapeJson(code), escapeJson(fingerprint), escapeJson(deviceName)
                    );
                    appendToFile(auditFile, auditEntry);
                } catch (Exception ignored) {}
            }

            String json = String.format(
                "{\"activated\":true,\"code\":\"%s\",\"tier\":\"LIFETIME_PRO\",\"deviceName\":\"%s\",\"token\":\"%s\",\"maxDevices\":2,\"expires\":\"NEVER\",\"offlineCapable\":true,\"message\":\"Device successfully activated with lifetime license.\"}",
                escapeJson(code), escapeJson(deviceName), token
            );
            logAuditEvent("ACTIVATE", code, fingerprint, "ACTIVATED_SUCCESS");
            sendJsonResponse(exchange, 200, json);
        }
    }

    // License Keygen Generator API (GET)
    static class LicenseGenerateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String query = exchange.getRequestURI().getQuery();
            String year = extractQueryParam(query, "year");
            if (year.isEmpty()) year = "2027";

            String newKey = generateKey(year);
            String json = String.format(
                "{\"generated\":true,\"code\":\"%s\",\"tier\":\"LIFETIME_PRO\",\"year\":\"%s\",\"valid\":true}",
                newKey, escapeJson(year)
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    // License Audit Log API
    static class LicenseAuditHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;
            
            String content = "[]";
            try {
                if (Files.exists(auditFile)) {
                    content = Files.readString(auditFile, StandardCharsets.UTF_8).trim();
                    if (content.endsWith(",")) content = content.substring(0, content.length() - 1);
                    if (!content.startsWith("[")) content = "[" + content + "]";
                }
            } catch (Exception ignored) {}
            sendJsonResponse(exchange, 200, content);
        }
    }

    // Fast Billing Catalog Rate Card
    static class BillingCatalogHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String catalogJson = "{\n" +
                "  \"currency\": \"LKR\",\n" +
                "  \"items\": [\n" +
                "    {\"id\":\"COPY_A4_BW\",\"name\":\"A4 Photocopy (Black & White)\",\"sinhala\":\"A4 කළු/සුදු පිටපත්\",\"unitPrice\":10.00,\"unit\":\"page\"},\n" +
                "    {\"id\":\"COPY_A4_COLOR\",\"name\":\"A4 Color Printout\",\"sinhala\":\"A4 වර්ණ මුද්‍රණය\",\"unitPrice\":40.00,\"unit\":\"page\"},\n" +
                "    {\"id\":\"LAMINATE_ID\",\"name\":\"Smart NIC / Card Lamination\",\"sinhala\":\"හැඳුනුම්පත් ලැමිනේට්\",\"unitPrice\":100.00,\"unit\":\"card\"},\n" +
                "    {\"id\":\"LAMINATE_A4\",\"name\":\"A4 Document Lamination\",\"sinhala\":\"A4 ලැමිනේට් කිරීම\",\"unitPrice\":150.00,\"unit\":\"sheet\"},\n" +
                "    {\"id\":\"NIC_1TO1_PRINT\",\"name\":\"Smart NIC 1:1 Scale Print (Single A4)\",\"sinhala\":\"NIC 1:1 පරිමාණ මුද්‍රණය\",\"unitPrice\":50.00,\"unit\":\"print\"},\n" +
                "    {\"id\":\"PASSPORT_PHOTO_8\",\"name\":\"Passport Photos (8-Photo Pack)\",\"sinhala\":\"පාස්පෝට් ඡායාරූප (8 කට්ටලය)\",\"unitPrice\":250.00,\"unit\":\"pack\"},\n" +
                "    {\"id\":\"SCHOOL_STICKERS_8\",\"name\":\"School Book Stickers (8-Sheet A4)\",\"sinhala\":\"පාසල් පොත් ස්ටිකර් (8 කට්ටලය)\",\"unitPrice\":150.00,\"unit\":\"sheet\"},\n" +
                "    {\"id\":\"SPIRAL_BINDING\",\"name\":\"Spiral Book Binding\",\"sinhala\":\"ස්පයිරල් බයින්ඩින් කිරීම\",\"unitPrice\":200.00,\"unit\":\"book\"},\n" +
                "    {\"id\":\"GOV_FORM_PRINT\",\"name\":\"Government Application Form\",\"sinhala\":\"රජයේ අයදුම්පත් පත්‍රය\",\"unitPrice\":30.00,\"unit\":\"form\"}\n" +
                "  ]\n" +
                "}";
            sendJsonResponse(exchange, 200, catalogJson);
        }
    }

    // POS Fast Billing Receipt Handler (POST)
    static class BillingReceiptHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed. Use POST.\"}");
                return;
            }

            String body = readRequestBody(exchange);
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String receiptId = "RCP-" + today + "-" + receiptSeq.getAndIncrement();
            
            // Extract core fields or calculate defaults
            String subtotalStr = extractJsonField(body, "subtotal");
            String discountStr = extractJsonField(body, "discount");
            String totalStr = extractJsonField(body, "total");
            String cashStr = extractJsonField(body, "cashTendered");
            String changeStr = extractJsonField(body, "changeDue");
            String paymentMethod = extractJsonField(body, "paymentMethod");
            if (paymentMethod.isEmpty()) paymentMethod = "CASH";

            double total = totalStr.isEmpty() ? 0.0 : parseDoubleSafe(totalStr);
            double cash = cashStr.isEmpty() ? total : parseDoubleSafe(cashStr);
            double change = changeStr.isEmpty() ? Math.max(0.0, cash - total) : parseDoubleSafe(changeStr);

            String timestamp = Instant.now().toString();

            String receiptRecord = String.format(
                "{\"receiptId\":\"%s\",\"timestamp\":\"%s\",\"total\":%.2f,\"cashTendered\":%.2f,\"changeDue\":%.2f,\"paymentMethod\":\"%s\",\"payload\":%s}",
                receiptId, timestamp, total, cash, change, escapeJson(paymentMethod), body.trim().isEmpty() ? "{}" : body
            );

            // Persist receipt
            synchronized (lock) {
                try {
                    String existing = Files.readString(receiptsFile, StandardCharsets.UTF_8).trim();
                    if (existing.startsWith("[") && existing.endsWith("]")) {
                        String inner = existing.substring(1, existing.length() - 1).trim();
                        String updated = inner.isEmpty() ? "[" + receiptRecord + "]" : "[" + inner + ",\n" + receiptRecord + "]";
                        Files.writeString(receiptsFile, updated, StandardCharsets.UTF_8);
                    } else {
                        Files.writeString(receiptsFile, "[" + receiptRecord + "]", StandardCharsets.UTF_8);
                    }
                } catch (Exception e) {
                    System.err.println("Error saving receipt: " + e.getMessage());
                }
            }

            // Return receipt with thermal printer layout
            String thermalText = formatThermalReceipt(receiptId, timestamp, total, cash, change, paymentMethod);
            String responseJson = String.format(
                "{\"saved\":true,\"receiptId\":\"%s\",\"timestamp\":\"%s\",\"total\":%.2f,\"changeDue\":%.2f,\"thermalText\":\"%s\"}",
                receiptId, timestamp, total, change, escapeJson(thermalText)
            );

            logAuditEvent("POS_SALE", receiptId, "POS_COUNTER", "LKR " + total);
            sendJsonResponse(exchange, 201, responseJson);
        }
    }

    // List Historical Receipts (GET)
    static class BillingReceiptListHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String json = "[]";
            try {
                if (Files.exists(receiptsFile)) {
                    json = Files.readString(receiptsFile, StandardCharsets.UTF_8);
                }
            } catch (Exception ignored) {}
            sendJsonResponse(exchange, 200, json);
        }
    }

    // Daily Sales Summary API (GET)
    static class BillingDailySummaryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            int count = 0;
            double grossRevenue = 0.0;
            double cashTotal = 0.0;
            double cardTotal = 0.0;
            double lankaQrTotal = 0.0;

            try {
                if (Files.exists(receiptsFile)) {
                    String content = Files.readString(receiptsFile, StandardCharsets.UTF_8);
                    String[] entries = content.split("\"receiptId\":");
                    for (int i = 1; i < entries.length; i++) {
                        String entry = entries[i];
                        if (entry.contains(today)) {
                            count++;
                            double t = extractDouble(entry, "\"total\":");
                            grossRevenue += t;
                            if (entry.contains("\"paymentMethod\":\"CASH\"")) cashTotal += t;
                            else if (entry.contains("\"paymentMethod\":\"CARD\"")) cardTotal += t;
                            else if (entry.contains("\"paymentMethod\":\"LANKAQR\"")) lankaQrTotal += t;
                            else cashTotal += t;
                        }
                    }
                }
            } catch (Exception ignored) {}

            String json = String.format(
                "{\"date\":\"%s\",\"currency\":\"LKR\",\"transactionCount\":%d,\"grossRevenue\":%.2f,\"cashTotal\":%.2f,\"cardTotal\":%.2f,\"lankaQrTotal\":%.2f}",
                today, count, grossRevenue, cashTotal, cardTotal, lankaQrTotal
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    // Curriculum Master API (GET)
    static class EducationCurriculumHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String curriculum = "{\n" +
                "  \"grades\": [1,2,3,4,5,6,7,8,9,10,11,12,13],\n" +
                "  \"curriculum\": {\n" +
                "    \"primary\": {\n" +
                "      \"grades\": [1,2,3,4,5],\n" +
                "      \"subjects\": [\n" +
                "        {\"en\":\"Sinhala Language\",\"si\":\"සිංහල භාෂාව\"},\n" +
                "        {\"en\":\"Mathematics\",\"si\":\"ගණිතය\"},\n" +
                "        {\"en\":\"Environment (ENV)\",\"si\":\"පරිසරය\"},\n" +
                "        {\"en\":\"English Language\",\"si\":\"ඉංග්‍රීසි භාෂාව\"},\n" +
                "        {\"en\":\"Buddhism\",\"si\":\"බුද්ධ ධර්මය\"},\n" +
                "        {\"en\":\"Tamil (Second Lang)\",\"si\":\"දෙමළ භාෂාව\"},\n" +
                "        {\"en\":\"Scholarship Papers\",\"si\":\"ශිෂ්‍යත්ව ප්‍රශ්න පත්‍ර\"},\n" +
                "        {\"en\":\"Essays & Creative\",\"si\":\"රචනා හා නිර්මාණ\"}\n" +
                "      ]\n" +
                "    },\n" +
                "    \"juniorSecondary\": {\n" +
                "      \"grades\": [6,7,8,9],\n" +
                "      \"subjects\": [\n" +
                "        {\"en\":\"Sinhala Language\",\"si\":\"සිංහල සාහිත්‍යය\"},\n" +
                "        {\"en\":\"Mathematics\",\"si\":\"ගණිතය\"},\n" +
                "        {\"en\":\"Science\",\"si\":\"විද්‍යාව\"},\n" +
                "        {\"en\":\"History\",\"si\":\"ඉතිහාසය\"},\n" +
                "        {\"en\":\"English Language\",\"si\":\"ඉංග්‍රීසි භාෂාව\"},\n" +
                "        {\"en\":\"Buddhism\",\"si\":\"බුද්ධ ධර්මය\"},\n" +
                "        {\"en\":\"Geography\",\"si\":\"භූගෝල විද්‍යාව\"},\n" +
                "        {\"en\":\"Citizenship Ed\",\"si\":\"පුරවැසි අධ්‍යාපනය\"}\n" +
                "      ]\n" +
                "    },\n" +
                "    \"olSenior\": {\n" +
                "      \"grades\": [10,11],\n" +
                "      \"subjects\": [\n" +
                "        {\"en\":\"Sinhala Language\",\"si\":\"සිංහල හා සාහිත්‍යය\"},\n" +
                "        {\"en\":\"Mathematics\",\"si\":\"ගණිතය\"},\n" +
                "        {\"en\":\"Science\",\"si\":\"විද්‍යාව\"},\n" +
                "        {\"en\":\"History\",\"si\":\"ඉතිහාසය\"},\n" +
                "        {\"en\":\"English Language\",\"si\":\"ඉංග්‍රීසි\"},\n" +
                "        {\"en\":\"Religion\",\"si\":\"ආගම\"},\n" +
                "        {\"en\":\"Commerce / ICT\",\"si\":\"වාණිජ්‍ය / තොරතුරු තාක්ෂණය\"},\n" +
                "        {\"en\":\"Art / Music / Drama\",\"si\":\"චිත්‍ර / සංගීත / නාට්‍ය\"}\n" +
                "      ]\n" +
                "    }\n" +
                "  }\n" +
                "}";
            sendJsonResponse(exchange, 200, curriculum);
        }
    }

    // Government Forms List API (GET)
    static class EducationFormsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleOptions(exchange)) return;

            String forms = "{\n" +
                "  \"forms\": [\n" +
                "    {\"id\":\"MTA_32\",\"title\":\"MTA-32 Driving License Application\",\"dept\":\"Motor Traffic Dept (MTA)\",\"pages\":2},\n" +
                "    {\"id\":\"PASSPORT_K\",\"title\":\"Form K - Sri Lanka Passport Application\",\"dept\":\"Immigration & Emigration Dept\",\"pages\":4},\n" +
                "    {\"id\":\"NIC_APP\",\"title\":\"Application for National Identity Card\",\"dept\":\"Department for Registration of Persons\",\"pages\":2},\n" +
                "    {\"id\":\"RENTAL_AGR\",\"title\":\"Standard House/Shop Rental Agreement\",\"dept\":\"Legal Forms & Sinhala Agreements\",\"pages\":3},\n" +
                "    {\"id\":\"AFFIDAVIT\",\"title\":\"General Sworn Affidavit (දිවුරුම් ප්‍රකාශය)\",\"dept\":\"Commissioner for Oaths\",\"pages\":1}\n" +
                "  ]\n" +
                "}";
            sendJsonResponse(exchange, 200, forms);
        }
    }

    // =========================================================================
    // Cryptographic & Business Helpers
    // =========================================================================

    private static String computeHash(String str) {
        int hash = 0;
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            hash = ((hash << 5) - hash) + c;
        }
        return Integer.toString(Math.abs(hash), 36).toUpperCase();
    }

    public static boolean verifyKey(String code) {
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

    public static String generateKey(String year) {
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

    private static String generateOfflineToken(String code, String fingerprint) {
        String data = code + "|" + fingerprint + "|" + TOKEN_SECRET;
        return "POTH-OFFLINE-TOKEN-" + computeHash(data) + "-" + Instant.now().getEpochSecond();
    }

    private static void logAuditEvent(String action, String keyOrId, String source, String status) {
        synchronized (lock) {
            try {
                String log = String.format(
                    "{\"timestamp\":\"%s\",\"action\":\"%s\",\"target\":\"%s\",\"source\":\"%s\",\"status\":\"%s\"},\n",
                    Instant.now().toString(), action, escapeJson(keyOrId), escapeJson(source), escapeJson(status)
                );
                appendToFile(auditFile, log);
            } catch (Exception ignored) {}
        }
    }

    private static void appendToFile(Path file, String content) throws IOException {
        Files.writeString(file, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }

    private static String formatThermalReceipt(String receiptId, String timestamp, double total, double cash, double change, String paymentMethod) {
        return "================================\n" +
               "       POTHAHALAPRO POS 🇱🇰      \n" +
               "  Bookshop & Print Production   \n" +
               "================================\n" +
               "Receipt:  " + receiptId + "\n" +
               "Date:     " + timestamp.substring(0, 19).replace("T", " ") + "\n" +
               "Payment:  " + paymentMethod + "\n" +
               "--------------------------------\n" +
               "TOTAL:            LKR " + String.format("%.2f", total) + "\n" +
               "Cash Tendered:    LKR " + String.format("%.2f", cash) + "\n" +
               "Change Due:       LKR " + String.format("%.2f", change) + "\n" +
               "================================\n" +
               " Thank you! Come Again.\n" +
               " Powered by PothHalaPro 1.1\n";
    }

    // =========================================================================
    // HTTP Utility Helpers
    // =========================================================================

    private static boolean handleOptions(HttpExchange exchange) throws IOException {
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int read;
            while ((read = is.read(buf)) != -1) {
                baos.write(buf, 0, read);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }
    }

    private static String extractQueryParam(String query, String param) {
        if (query == null || !query.contains(param + "=")) return "";
        try {
            String[] parts = query.split(param + "=")[1].split("&");
            return URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private static String extractJsonField(String json, String field) {
        if (json == null || !json.contains("\"" + field + "\"")) return "";
        try {
            int idx = json.indexOf("\"" + field + "\"");
            int colon = json.indexOf(":", idx);
            int startQuote = json.indexOf("\"", colon);
            if (startQuote != -1 && startQuote < json.indexOf("\n", colon)) {
                int endQuote = json.indexOf("\"", startQuote + 1);
                if (endQuote != -1) {
                    return json.substring(startQuote + 1, endQuote);
                }
            } else {
                int start = colon + 1;
                while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
                int end = start;
                while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.')) end++;
                return json.substring(start, end);
            }
        } catch (Exception ignored) {}
        return "";
    }

    private static double extractDouble(String text, String prefix) {
        try {
            int idx = text.indexOf(prefix);
            if (idx == -1) return 0.0;
            int start = idx + prefix.length();
            while (start < text.length() && (Character.isWhitespace(text.charAt(start)) || text.charAt(start) == '"')) start++;
            int end = start;
            while (end < text.length() && (Character.isDigit(text.charAt(end)) || text.charAt(end) == '.')) end++;
            return Double.parseDouble(text.substring(start, end));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private static double parseDoubleSafe(String str) {
        try {
            return Double.parseDouble(str.trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private static int countOccurrences(String text, String sub) {
        int count = 0;
        int idx = 0;
        while ((idx = text.indexOf(sub, idx)) != -1) {
            count++;
            idx += sub.length();
        }
        return count;
    }

    private static String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\b", "\\b")
                  .replace("\f", "\\f")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
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
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }
}
