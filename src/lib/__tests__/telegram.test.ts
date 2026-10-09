import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendAdminRegistrationTelegram } from "@/lib/telegram";

const data = {
  studentName: "Budi <b>& Co",
  address: "Jl. Sudirman 1, Balikpapan",
  whatsappNumber: "0812-3456-7890",
  email: "budi@example.com",
  selectedClass: "Weekend Coding Class",
  voucherCode: null,
  voucherApplied: false,
  createdAt: "2026-10-09T02:00:00.000Z",
};

describe("sendAdminRegistrationTelegram", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("skips sending when not configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");

    const result = await sendAdminRegistrationTelegram(data);

    expect(result).toEqual({ success: false, reason: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts an escaped message with a WhatsApp button", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "987");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    const result = await sendAdminRegistrationTelegram(data);

    expect(result.success).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    const body = JSON.parse(init.body);
    expect(body.chat_id).toBe("987");
    expect(body.parse_mode).toBe("HTML");
    expect(body.text).toContain("Budi &lt;b&gt;&amp; Co");
    expect(body.text).toContain("Weekend Coding Class");
    expect(body.reply_markup.inline_keyboard[0][0].url).toMatch(
      /^https:\/\/wa\.me\/6281234567890\?text=/,
    );
  });

  it("reports failure when the Telegram API rejects the request", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:abc");
    vi.stubEnv("TELEGRAM_CHAT_ID", "987");
    fetchMock.mockResolvedValue(
      new Response('{"ok":false,"description":"chat not found"}', {
        status: 400,
      }),
    );

    const result = await sendAdminRegistrationTelegram(data);

    expect(result.success).toBe(false);
  });
});
