import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentRequest, getPaymentRequest } from "@/lib/mayar";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("mayar client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockReset();
    vi.stubEnv("MAYAR_API_KEY", "test-key");
    vi.stubEnv("MAYAR_API_BASE_URL", "https://api.mayar.io/hl/v2/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates a payment request and returns id + link", async () => {
    fetchMock.mockResolvedValue(
      json({
        statusCode: 200,
        messages: "success",
        data: { id: "pay-1", transactionId: "trx-1", link: "https://x.myr.id/pl/abc" },
      }),
    );

    const res = await createPaymentRequest({ name: "Budi", amount: 399000, email: "b@x.com" });

    expect(res).toEqual({
      success: true,
      data: { id: "pay-1", transactionId: "trx-1", link: "https://x.myr.id/pl/abc" },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mayar.io/hl/v2/payments/create");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toMatchObject({ name: "Budi", amount: 399000 });
  });

  it("treats a non-200 statusCode in the body as failure even on HTTP 200", async () => {
    fetchMock.mockResolvedValue(json({ statusCode: 400, message: "channel not enabled" }));

    const res = await createPaymentRequest({ name: "Budi", amount: 399000 });

    expect(res).toEqual({ success: false, error: "channel not enabled" });
  });

  it("reports network errors and timeouts without throwing", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));

    const res = await getPaymentRequest("pay-1");

    expect(res.success).toBe(false);
  });

  it("skips the request when the API key is not configured", async () => {
    vi.stubEnv("MAYAR_API_KEY", "");

    const res = await getPaymentRequest("pay-1");

    expect(res).toEqual({ success: false, error: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads the payment status", async () => {
    fetchMock.mockResolvedValue(
      json({ statusCode: 200, messages: "success", data: { id: "pay-1", status: "paid", amount: 399000 } }),
    );

    const res = await getPaymentRequest("pay-1");

    expect(res.success && res.data.status).toBe("paid");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.mayar.io/hl/v2/payments/pay-1");
  });
});
