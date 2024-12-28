const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.static('public'));

const secretKey = "sk_sbox_3ih4tvdq7byb3b2akct5n64va4h"; // Hardcoded secret key

// Serve the checkout page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

// Create payment session
app.post("/create-payment-session", async (req, res) => {
  try {
    const { storedCardId } = req.body; // Expecting storedCardId from frontend if applicable

    // Define the items array
    const items = [
      {
        type: "physical",
        name: "ASOS DESIGN oversized sweatshirt",
        quantity: 1,
        unit_price: 3250,
        reference: "ASOC-001",
        total_amount: 3250
      }
    ];

    // Calculate the total amount
    const total = items.reduce((acc, item) => acc + item.total_amount, 0);

    // Prepare the payment session payload
    const paymentSessionPayload = {
      amount: total,
      currency: "GBP",
      reference: `ORD-${Date.now()}`,
      enabled_payment_methods: ["card", "klarna", "paypal"],
      billing: {
        address: {
          country: "GB",
          address_line1: "21 Boomtown Apartments",
          address_line2: "2 Progressive Close",
          city: "Sidcup",
          state: "EN",
          zip: "DA14 5HZ"
        }
      },
      capture: true,
      "3ds": {
        enabled: true,
        attempt_n3d: true
      },
      customer: {
        name: "Bruce Wayne",
        email: "brucewayne@gmail.com"
      },
      processing_channel_id: "pc_eonbfv5qtimefo2mizmgmy3c5y", // Added back
      success_url: "https://www.asos.com/men/",
      failure_url: "http://localhost:3000/failure",
      items: items
    };

    // Include source if storedCardId is provided
    if (storedCardId && storedCardId.trim() !== "") {
      paymentSessionPayload.source = {
        type: "card",
        id: storedCardId
      };
    }

    const paymentSessionResponse = await axios.post(
      "https://api.sandbox.checkout.com/payment-sessions",
      paymentSessionPayload,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(paymentSessionResponse.data);
  } catch (error) {
    console.error("Payment session error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Payment session creation failed",
      details: error.response?.data || error.message
    });
  }
});

// Get Stored Cards
app.get("/get-stored-cards", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required." });
  }

  try {
    const customerResponse = await axios.get(
      `https://api.sandbox.checkout.com/customers/${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const storedCards = customerResponse.data.instruments || [];
    res.json({ email: customerResponse.data.email, cards: storedCards });
  } catch (error) {
    console.error("Error fetching stored cards:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch stored cards",
      details: error.response?.data || error.message
    });
  }
});

// Success and Failure Routes
app.get("/success", (req, res) => {
  res.send("Payment successful! You can close this window.");
});

app.get("/failure", (req, res) => {
  res.send("Payment failed. Please try again.");
});

// Start the Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
