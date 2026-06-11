import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendApplicationConfirmation } from "@/lib/email";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const params = {
  to: "applicant@example.com",
  applicantName: "Test Applicant",
  applicationNumber: "APP-123",
  propertyTitle: "Test Property",
};

describe("sendOptionalEmail via sendApplicationConfirmation", () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "onboarding@resend.dev");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes the trimmed EMAIL_FROM value as the sender", async () => {
    vi.stubEnv("EMAIL_FROM", "  YellowRiver <test@resend.dev>  ");
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("sent");
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "YellowRiver <test@resend.dev>",
        to: params.to,
      })
    );
  });

  it("skips with missing_EMAIL_FROM when EMAIL_FROM is unset", async () => {
    vi.stubEnv("EMAIL_FROM", "");

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("missing_EMAIL_FROM");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("skips with missing_EMAIL_FROM when EMAIL_FROM is blank", async () => {
    vi.stubEnv("EMAIL_FROM", "   ");

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("missing_EMAIL_FROM");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("skips with missing_RESEND_API_KEY when the key is unset", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("missing_RESEND_API_KEY");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("reports a failed result when the SDK resolves with an error object", async () => {
    // The Resend SDK never throws on API errors — they arrive in the
    // resolved { data, error } union. This pins the fix for the old dead
    // try/catch that reported provider rejections as "sent".
    sendMock.mockResolvedValue({
      data: null,
      error: {
        name: "testing_restriction",
        message: "You can only send testing emails to your own email address",
        statusCode: 403,
      },
    });

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("failed");
    expect(result.reason).toBe("testing_restriction");
    expect(result.error).toBe(
      "You can only send testing emails to your own email address"
    );
  });

  it("reports sent when the SDK resolves with data and no error", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_2" }, error: null });

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("sent");
    expect(result.error).toBeUndefined();
  });

  it("still reports failed when the SDK throws unexpectedly", async () => {
    sendMock.mockRejectedValue(new Error("socket hang up"));

    const result = await sendApplicationConfirmation(params);

    expect(result.status).toBe("failed");
    expect(result.reason).toBe("provider_send_failed");
    expect(result.error).toBe("socket hang up");
  });
});
