(async () => {
  try {
    const customerEmail = "brucewayne@gmail.com";

    const storedCardsResponse = await fetch(`/get-stored-cards?email=${encodeURIComponent(customerEmail)}`);
    if (!storedCardsResponse.ok) {
      throw new Error('Failed to fetch stored cards');
    }

    const storedCardsData = await storedCardsResponse.json();
    const storedCards = storedCardsData.cards || [];

    const response = await fetch("/create-payment-session", { 
      method: "POST",
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Payment session creation failed');
    }

    const paymentSession = await response.json();

    const storedCardsContainer = document.getElementById("stored-cards-container");
    storedCardsContainer.innerHTML = '';

    // Example fake billing address for demonstration:
    const billingName = "Bruce Wayne";
    const addressLine1 = "Wayne Manor UK";
    const city = "London";
    const postcode = "L1 457";
    const country = "UK";
    const phone = "07392001344";

    if (storedCards.length > 0) {
      const card = storedCards[0];
      const expiryMonth = card.expiry_month.toString().padStart(2, '0');
      const expiryYear = card.expiry_year;
      
      storedCardsContainer.innerHTML = `
        <div class="white-section payment-section">
            <h2 class="payment-heading">Payment</h2>
            <div class="payment-details">
                <div class="billing-address">
                    <div class="section-subheading">Billing Address</div>
                    <div class="billing-info">
                        ${billingName}<br>
                        ${addressLine1}<br>
                        ${city}<br>
                        ${postcode}<br>
                        ${country}<br>
                        ${phone}
                    </div>
                    <button class="change-button">Change</button>
                </div>
                <hr class="payment-divider">
                <div class="payment-type">
                    <div class="payment-type-header">
                        <span class="section-subheading">Payment Type</span>
                        <button class="change-button">Change</button>
                    </div>
                    <div class="payment-method-info">
                        <div class="payment-method-label">Credit / Debit Card</div>
                        <div class="stored-card-info">
                            <div class="card-icon">
                                <img src="/img/visa.jpg" alt="Visa" class="accepted-logo">
                            </div>
                            <div class="card-details">
                                <strong>Debit Mastercard (**** ${card.last4})</strong><br>
                                Exp: ${expiryMonth}/${expiryYear}<br>
                                ${billingName}
                            </div>
                        </div>
                        <div class="cvv-section">
                            <span class="cvv-label">CVV</span><br>
                            <input type="text" class="cvv-input" maxlength="3" placeholder="">
                        </div>
                        <div id="buy-now-container" class="buy-now-container">
                            <div class="accepted-methods">
                                <span class="accepted-label">WE ACCEPT:</span>
                                <img src="/img/visa.jpg" alt="Visa" class="accepted-logo">
                                <img src="/img/mastercard.jpg" alt="Mastercard" class="accepted-logo">
                                <img src="/img/paypal.jpg" alt="PayPal" class="accepted-logo">
                                <img src="/img/amex.jpg" alt="American Express" class="accepted-logo">
                                <img src="/img/klarna.jpg" alt="Klarna" class="accepted-logo">
                                <img src="/img/applepay.jpg" alt="Apple Pay" class="accepted-logo">
                            </div>
                            <button id="buy-now-button" class="buy-now-button" type="button">BUY NOW</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      `;

      // Now that the HTML is inserted, attach event listeners
      const buyNowButton = document.getElementById('buy-now-button');
      const paymentCollapse = document.getElementById('paymentCollapse');

      if (paymentCollapse && buyNowButton) {
        paymentCollapse.addEventListener('show.bs.collapse', () => {
          // Hide the buy now button
          buyNowButton.classList.add('hidden');
        });

        paymentCollapse.addEventListener('hide.bs.collapse', () => {
          paymentCollapse.addEventListener('hidden.bs.collapse', function handler() {
            // Show the buy now button again
            buyNowButton.classList.remove('hidden');
            paymentCollapse.removeEventListener('hidden.bs.collapse', handler);
          });
        });
      }

    } else {
      storedCardsContainer.innerHTML = '<p>No stored cards found.</p>';
    }

    const checkoutWebComponents = await CheckoutWebComponents({
      publicKey: "pk_sbox_e5v4rg3sztzmdusp47pvdg53kmc",
      environment: "sandbox",
      locale: "en-GB",
      paymentSession,
      onReady: () => {
        console.log("Payment components ready");
      },
      onPaymentCompleted: (component, paymentResponse) => {
        const element = document.getElementById("successful-payment-message");
        if (element) {
          element.innerHTML = `Payment completed successfully<br>ID: ${paymentResponse.id}`;
        }
      },
      onError: (component, error) => {
        const element = document.getElementById("error-message");
        if (element) {
          element.innerHTML = `Payment error: ${error.message}`;
        }
      },
      appearance: {
        colorAction: '#169f62',
        colorBackground: '#ffffff',
        colorBorder: '#ddd',
        colorDisabled: '#e8e8e8',
        colorError: '#dc3545',
        colorFormBackground: '#ffffff',
        colorFormBorder: '#ddd',
        colorInverse: '#ffffff',
        colorOutline: '#2d2d2d',
        colorPrimary: '#2d2d2d',
        colorSecondary: '#666666',
        colorSuccess: '#169f62',
        button: {
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          lineHeight: '20px',
        },
        label: {
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          lineHeight: '16px',
          textTransform: 'uppercase',
        }
      },
      componentOptions: {
        card: {
          displayCardholderName: 'top'
        }
      }
    });

    const payments = checkoutWebComponents.create("payments");
    payments.mount(document.getElementById("payments"));

  } catch (error) {
    console.error('Payment initialization error:', error);
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.innerHTML = 'Unable to initialize payment system. Please try again later.';
    }
  }
})();
