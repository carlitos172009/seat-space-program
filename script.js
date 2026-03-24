<script>
  const rows = 5;
  const cols = 6;

  const seatGrid = document.getElementById("seatGrid");
  const cartContainer = document.getElementById("cartContainer");
  const totalPriceText = document.getElementById("totalPrice");

  let selectedSeats = [];
  let occupiedSeats = [];

  function seatId(row, col) {
    return String.fromCharCode(65 + row) + (col + 1);
  }

  // ✅ LOAD SEATS FROM FIREBASE
  async function loadSeats() {
    if (!window.firebaseReady) return;

    const { db, EVENT_ID } = window;

    try {
      const docRef = doc(db, "events", EVENT_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        const today = new Date();
        const eventDate = new Date(data.date);

        // ✅ AUTO RESET LOGIC
        if (today > eventDate) {
          occupiedSeats = [];
        } else {
          occupiedSeats = data.seats.map(s => s.id);
        }

      } else {
        // create event if not exists
        await setDoc(docRef, {
          date: "2026-04-01",
          seats: []
        });

        occupiedSeats = [];
      }

      renderSeats();

    } catch (error) {
      console.error("Error loading seats:", error);
    }
  }

  function renderSeats() {
    seatGrid.innerHTML = "";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = seatId(r, c);
        const seat = document.createElement("div");

        seat.textContent = id;
        seat.className = "p-3 text-center rounded cursor-pointer";

        if (occupiedSeats.includes(id)) {
          seat.classList.add("bg-red-400", "cursor-not-allowed");
        } else if (selectedSeats.find(s => s.id === id)) {
          seat.classList.add("bg-green-400");
        } else {
          seat.classList.add("bg-gray-300");
        }

        seat.addEventListener("click", () => {
          if (occupiedSeats.includes(id)) return;

          const existing = selectedSeats.find(s => s.id === id);

          if (existing) {
            selectedSeats = selectedSeats.filter(s => s.id !== id);
          } else {
            selectedSeats.push({ id: id, type: "adult" });
          }

          renderSeats();
          renderCart();
        });

        seatGrid.appendChild(seat);
      }
    }
  }

  function renderCart() {
    cartContainer.innerHTML = "";

    if (selectedSeats.length === 0) {
      cartContainer.innerHTML = "<p>No seats selected</p>";
      totalPriceText.textContent = "$0";
      return;
    }

    let total = 0;

    selectedSeats.forEach((seat, index) => {
      const price = seat.type === "adult" ? 10 : 5;
      total += price;

      const row = document.createElement("div");
      row.className = "flex justify-between items-center mb-2";

      row.innerHTML = `
        <span>${seat.id}</span>
        <select data-index="${index}" class="border p-1 rounded">
          <option value="adult" ${seat.type === "adult" ? "selected" : ""}>Adult ($10)</option>
          <option value="child" ${seat.type === "child" ? "selected" : ""}>Child ($5)</option>
        </select>
        <span>$${price}</span>
      `;

      cartContainer.appendChild(row);
    });

    totalPriceText.textContent = "Total: $" + total;

    document.querySelectorAll("select").forEach(select => {
      select.addEventListener("change", (e) => {
        const index = e.target.dataset.index;
        selectedSeats[index].type = e.target.value;
        renderCart();
      });
    });
  }

  // ✅ SAVE PURCHASE TO FIREBASE
  async function savePurchase() {
    const { db, EVENT_ID } = window;

    try {
      const docRef = doc(db, "events", EVENT_ID);
      const docSnap = await getDoc(docRef);

      let existingSeats = [];

      if (docSnap.exists()) {
        existingSeats = docSnap.data().seats || [];
      }

      const updatedSeats = [...existingSeats, ...selectedSeats];

      await setDoc(docRef, {
        date: "2026-04-01",
        seats: updatedSeats
      });

      console.log("Saved to Firebase:", updatedSeats);

    } catch (error) {
      console.error("Error saving:", error);
    }
  }

  document.getElementById("buyBtn").addEventListener("click", async () => {
    if (selectedSeats.length === 0) {
      alert("Select at least one seat!");
      return;
    }

    await savePurchase();

    alert("Purchase successful!");

    selectedSeats = [];

    await loadSeats();
    renderCart();
  });

  // INIT
  loadSeats();
  renderCart();
</script>
