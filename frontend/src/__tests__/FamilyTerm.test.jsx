import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

const json = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const session = {
  view: "family",
  selectedPlan: "unlimited",
  selectedTerm: "3",
  selectedSim: "esim",
  factsTerm: "3",
  selectedBrand: "",
  selectedModel: "",
  cartItems: [],
  faqOpenId: "",
  family: {
    lines: 3,
    planType: "plus",
    simTypes: ["esim", "esim", "esim"],
    brands: ["Apple", "Apple", "Apple"],
    models: ["iPhone 16", "iPhone 16", "iPhone 16"],
    includesOpen: false,
    message: "",
    discountType: "",
    discountModalOpen: false,
  },
  coverage: { zip: "", message: "", deviceMessage: "" },
  promo: { open: false, code: "", discount: 0, applied: false, adOpen: false, message: "" },
  newsletter: { email: "", subscribedAt: "", message: "" },
};

describe("family billing term", () => {
  let calls;

  beforeEach(() => {
    window.scrollTo = vi.fn();
    calls = [];
    global.fetch = vi.fn(async (url, options = {}) => {
      const path = String(url).split("?")[0];
      const body = options.body ? JSON.parse(options.body) : null;
      calls.push({ path, method: options.method || "GET", body });
      if (path.endsWith("/budgetwise/session")) return json({ user_id: "t", session });
      if (path.endsWith("/budgetwise/family/validate")) return json({ valid: true, message: "" });
      if (path.endsWith("/budgetwise/cart/family")) {
        const months = Number(body.term) || 1;
        return json({
          item: {
            id: "cart-family-t", itemType: "family", planId: "plus", planName: "BudgetWise Plus",
            term: body.term ?? "1", simTypes: body.sim_types, lineDetails: body.line_details,
            quantity: 1, lines: 3, pricePerLine: 140 / 3, monthlyTotal: 140, originalTotal: 185,
            upfrontTotal: 140 * months, bundleId: "family-t", addedAt: "",
          },
        });
      }
      return json({});
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const lastCall = (suffix, method) =>
    calls.filter((call) => call.path.endsWith(suffix) && call.method === method).at(-1);

  it("bills a family plan monthly by default", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: /^Continue$/ }));
    await user.click(await screen.findByRole("button", { name: /Add to Cart/i }));

    await waitFor(() => expect(lastCall("/budgetwise/cart/family", "POST")).toBeTruthy());
    expect(lastCall("/budgetwise/cart/family", "POST").body.term).toBe("1");
    expect(await screen.findByText("Monthly Plan - 3 lines")).toBeInTheDocument();
  });

  it("sends a chosen term with the family plan and shows it in the cart", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: /^Continue$/ }));
    await user.click(await screen.findByRole("button", { name: "6-Month" }));
    expect(screen.getByText("$840.00 for 6 months")).toBeInTheDocument();
    await waitFor(() => expect(lastCall("/budgetwise/family", "PUT")?.body.term).toBe("6"));
    await user.click(screen.getByRole("button", { name: /Add to Cart/i }));

    await waitFor(() => expect(lastCall("/budgetwise/cart/family", "POST")).toBeTruthy());
    expect(lastCall("/budgetwise/cart/family", "POST").body.term).toBe("6");
    expect(await screen.findByText("6-Month Plan - 3 lines")).toBeInTheDocument();
    expect(screen.getByText("$840.00 for 6 months")).toBeInTheDocument();
  });
});
