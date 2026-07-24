import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";

const buildResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("App", () => {
  const statePayload = {
    user_id: "test-user",
    session: {
      view: "home",
      selectedPlan: "unlimited",
      selectedTerm: "3",
      selectedSim: "esim",
      factsTerm: "3",
      selectedBrand: "",
      selectedModel: "",
      cartItems: [],
      faqOpenId: "",
      family: {
        lines: 1,
        planType: "",
        simTypes: ["esim"],
        brands: [""],
        models: [""],
        includesOpen: false,
        message: "",
        discountType: "",
        discountModalOpen: false,
      },
      coverage: { zip: "", message: "", deviceMessage: "" },
      promo: {
        open: false,
        code: "",
        discount: 0,
        applied: false,
        adOpen: true,
        message: "",
      },
      newsletter: { email: "", subscribedAt: "", message: "" },
    },
  };

  beforeEach(() => {
    window.scrollTo = vi.fn();
    global.fetch = vi.fn(async () => buildResponse(statePayload));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the BudgetWise storefront", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /Pay upfront for bigger savings/i })
    ).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("heading", { name: /Choose Your Plan/i })).toBeInTheDocument();
  });

  it("renders product navigation without a generic editor", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: /Pay upfront for bigger savings/i });
    expect(screen.queryByRole("textbox", { name: /json payload/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Plans$/i })).toBeInTheDocument();
  });
});
